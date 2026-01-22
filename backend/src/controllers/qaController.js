const KiyohAPI = require('../services/kiyohAPI');
const GeminiService = require('../services/geminiService');
const CacheService = require('../services/cacheService');
const customerService = require('../services/customerService');
const QAPair = require('../models/QAPair');
const Analytics = require('../models/Analytics');
const { buildQAPrompt } = require('../utils/promptBuilder');
const logger = require('../utils/logger');
const crypto = require('crypto');

const kiyohAPI = new KiyohAPI(process.env.KIYOH_BASE_URL);
const geminiService = new GeminiService(
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'
);
const cacheService = new CacheService();

/**
 * Main Q&A endpoint
 */
async function handleQuestion(req, res, next) {
  const startTime = Date.now();
  const { locationId, productCode, productIdentifier, productContext, question, language = 'nl' } = req.body;

  let cached = false;
  let error = null;

  try {
    const pCode = productCode || (productIdentifier?.type === 'gtin' ? productIdentifier.value : null);
    const pName = productContext?.name || (productIdentifier?.type === 'name' ? productIdentifier.value : null);

    logger.info(`Processing question for location ${locationId}, product ${pCode || pName || 'unknown'}`);

    // Log environment status
    logger.info(`Env Check - GEMINI: ${process.env.GEMINI_API_KEY ? 'Set' : 'Missing'}, KIYOH_URL: ${process.env.KIYOH_BASE_URL || 'Default'}`);

    // Fetch customer and API token from database
    const customer = await customerService.getCustomerByLocationId(locationId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found. Please contact support to activate your widget.'
      });
    }

    logger.info(`Customer found: ${customer.company_name} (ID: ${customer.id})`);

    const apiToken = customer.api_token;
    if (!apiToken) {
      logger.error('API Token is missing in database object:', Object.keys(customer));
      throw new Error('Customer configuration error: API token missing');
    }

    logger.info(`Using Kiyoh Token: ${apiToken.substring(0, 4)}...${apiToken.substring(apiToken.length - 4)}`);

    // Check cache for Q&A (only if we have a stable identifier like GTIN)
    if (pCode) {
      const cachedAnswer = await cacheService.getQA(pCode, question);
      if (cachedAnswer) {
        logger.info('Returning cached answer');
        cached = true;

        // Log analytics
        await Analytics.log({
          locationId,
          productCode: pCode,
          question,
          answerProvided: true,
          cached: true,
          responseTimeMs: Date.now() - startTime,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        return res.json({
          success: true,
          data: {
            ...cachedAnswer,
            metadata: {
              ...cachedAnswer.metadata,
              cached: true,
              responseTime: Date.now() - startTime
            }
          }
        });
      }
    }

    // Fetch product reviews from Kiyoh
    const kiyohData = await kiyohAPI.getProductReviews(locationId, apiToken, {
      productCode: pCode,
      productName: pName
    });

    if (!kiyohData.reviews || kiyohData.reviews.length === 0) {
      // If no reviews but we have product context (specs), we can still proceed
      if (!productContext || (!productContext.specs && !productContext.description)) {
        throw new Error('Product not found or no reviews available');
      }
      logger.info('No reviews found, but using product context for answer');
    }

    // Get product info
    const productInfo = kiyohAPI.getProductInfo(kiyohData, pCode);

    // Build Gemini prompt
    const { systemInstruction, prompt } = buildQAPrompt(
      {
        productName: pName || productInfo.productName,
        gtin: productInfo.gtin || pCode,
        averageRating: kiyohData.averageRating,
        reviewCount: kiyohData.reviewCount
      },
      kiyohData.reviews || [],
      question,
      language,
      productContext
    );

    logger.info(`🤖 Sending to Gemini AI:`, {
      questionLength: question.length,
      reviewCount: (kiyohData.reviews || []).length,
      hasProductContext: !!productContext,
      promptLength: prompt.length
    });

    // Generate answer with Gemini
    const { answer, confidence, tokensUsed } = await geminiService.generateAnswer(
      systemInstruction,
      prompt
    );

    logger.info(`✅ Gemini Response:`, {
      answerLength: answer.length,
      confidence,
      tokensUsed
    });

    // Extract relevant review snippets
    const relevantReviews = extractRelevantReviews(kiyohData.reviews || [], question, 3);

    // Prepare response
    const responseData = {
      question,
      answer,
      confidence,
      product: {
        name: pName || productInfo.productName,
        gtin: productInfo.gtin || pCode,
        rating: kiyohData.averageRating,
        reviewCount: kiyohData.reviewCount,
        imageUrl: productInfo.imageUrl
      },
      relevantReviews,
      metadata: {
        answeredAt: new Date().toISOString(),
        cached: false,
        tokensUsed,
        responseTime: Date.now() - startTime
      }
    };

    // Cache the answer if we have a stable code
    if (pCode) {
      await cacheService.cacheQA(pCode, question, responseData);
    }

    // Save to database
    const questionHash = crypto.createHash('md5')
      .update(question.toLowerCase().trim())
      .digest('hex');

    // Only save if we have a product code, otherwise it's hard to retrieve
    if (pCode) {
      await QAPair.create({
        locationId,
        productCode: pCode,
        question,
        questionHash,
        answer,
        confidence,
        language,
        tokensUsed
      });
    }

    // Increment question counter
    if (pCode) {
      await cacheService.incrementQuestionCount(locationId, pCode, question);
    }

    // Log analytics
    await Analytics.log({
      locationId,
      productCode: pCode || 'unknown',
      question,
      answerProvided: true,
      cached: false,
      responseTimeMs: Date.now() - startTime,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (err) {
    error = err.message;

    // Log analytics even on error
    await Analytics.log({
      locationId,
      productCode,
      question,
      answerProvided: false,
      cached: false,
      responseTimeMs: Date.now() - startTime,
      error: err.message,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    next(err);
  }
}

/**
 * Extract relevant review snippets
 */
function extractRelevantReviews(reviews, question, limit = 3) {
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const scored = reviews.map(review => {
    const text = `${review.oneliner} ${review.description}`.toLowerCase();
    let score = 0;

    questionWords.forEach(word => {
      if (text.includes(word)) score += 2;
    });

    // Boost reviews with descriptions
    if (review.description && review.description.length > 50) score += 1;

    // Boost recent reviews
    const daysSince = (Date.now() - new Date(review.dateSince)) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) score += 1;

    return { ...review, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(review => ({
      rating: review.rating,
      excerpt: review.description || review.oneliner,
      author: review.reviewAuthor,
      date: review.dateSince
    }));
}

/**
 * Get popular questions
 */
async function getPopularQuestions(req, res, next) {
  try {
    const { locationId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const popularQuestions = await cacheService.getPopularQuestions(locationId, limit);

    res.json({
      success: true,
      data: {
        questions: popularQuestions
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Q&A history for a product
 */
async function getQAHistory(req, res, next) {
  try {
    const { productCode } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const history = await QAPair.getByProduct(productCode, limit);

    res.json({
      success: true,
      data: {
        productCode,
        qaHistory: history
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleQuestion,
  getPopularQuestions,
  getQAHistory
};
