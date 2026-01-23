const KiyohAPI = require('../services/kiyohAPI');
const GeminiService = require('../services/geminiService');
const CacheService = require('../services/cacheService');
const customerService = require('../services/customerService');
const scraperService = require('../services/scraperService');
const QAPair = require('../models/QAPair');
const Analytics = require('../models/Analytics');
const { buildQAPrompt } = require('../utils/promptBuilder');
const logger = require('../utils/logger');
const crypto = require('crypto');

const kiyohAPI = new KiyohAPI(process.env.KIYOH_BASE_URL);
const geminiService = new GeminiService(
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
);
const cacheService = new CacheService();

/**
 * Main Q&A endpoint
 */
async function handleQuestion(req, res, next) {
  const startTime = Date.now();
  let { locationId, productCode, productIdentifier, productContext, question, language = 'nl', sourceUrl } = req.body;

  let cached = false;
  let error = null;

  try {
    // 1. Fallback Scraper Logic - run if no context OR if context has no identifiers
    const hasIdentifiers = productContext && (productContext.sku || productContext.productId || productContext.gtin);
    if ((!productContext || Object.keys(productContext).length === 0 || !hasIdentifiers) && sourceUrl) {
      logger.info(`Frontend context missing identifiers. Attempting backend scrape for: ${sourceUrl}`);
      try {
        const scrapedContext = await scraperService.scrape(sourceUrl);
        if (scrapedContext) {
          productContext = scrapedContext;
          logger.info('Backend scrape successful');

          // Use scraped identifiers if no explicit productCode provided
          if (!productCode && (scrapedContext.sku || scrapedContext.productId || scrapedContext.gtin)) {
            productCode = scrapedContext.gtin || scrapedContext.sku || scrapedContext.productId;
            logger.info(`Using scraped product identifier: ${productCode}`);
          }
        } else {
          logger.warn('Backend scrape returned no data');
        }
      } catch (scrapeErr) {
        logger.error(`Backend scrape failed: ${scrapeErr.message}`);
      }
    }

    // 2. Extract clean product identifiers (handle objects/strings)
    let pCode = null;

    //If productCode is an object (frontend bug), try to extract value
    if (productCode && typeof productCode === 'object') {
      logger.warn(`productCode is an object, attempting extraction: ${JSON.stringify(productCode)}`);
      pCode = productCode.value || productCode.code || productCode.sku || productCode.gtin || null;
    } else if (productCode && typeof productCode === 'string') {
      pCode = productCode;
    }

    // Fallback to productIdentifier
    if (!pCode && productIdentifier?.type === 'gtin') {
      pCode = String(productIdentifier.value || '');
    }

    // Fallback to scraped context - PRIORITY: productId > gtin > sku
    if (!pCode && productContext) {
      pCode = productContext.productId || productContext.gtin || productContext.sku || null;
      if (pCode) {
        logger.info(`Using product identifier from context: ${pCode} (source: ${productContext.productId ? 'productId' : productContext.gtin ? 'gtin' : 'sku'})`);
      }
    }

    const pName = productContext?.name
      ? String(productContext.name)
      : (productIdentifier?.type === 'name' ? String(productIdentifier.value || '') : null);

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


    // Fetch product reviews AND company (shop) reviews in parallel
    const [kiyohData, companyData] = await Promise.all([
      kiyohAPI.getProductReviews(locationId, apiToken, {
        productCode: pCode,
        productName: pName
      }),
      kiyohAPI.getCompanyReviews(locationId, apiToken)
    ]);

    if (!kiyohData.reviews || kiyohData.reviews.length === 0) {
      // If no reviews but we have product context (any specs, title, or description), we can still proceed
      if (!productContext || Object.keys(productContext).length === 0) {
        // Only throw if we truly have nothing
        throw new Error('Product not found or no reviews available');
      }
      logger.info('No reviews found, but using available product context for answer');
    }

    // Get product info
    const productInfo = kiyohAPI.getProductInfo(kiyohData, pCode);

    // Build Gemini prompt
    const { systemInstruction, prompt } = buildQAPrompt(
      {
        productName: pName || productInfo.productName,
        gtin: productInfo.gtin || pCode,
        averageRating: kiyohData.averageRating,
        reviewCount: kiyohData.reviewCount, // Product specific count
        shopRating: companyData.averageRating,
        shopReviewCount: companyData.reviewCount,
        recommendationPercentage: companyData.recommendationPercentage
      },
      kiyohData.reviews || [],
      question,
      language,
      productContext
    );

    logger.info(`🤖 Sending to Gemini AI:`, {
      questionLength: question.length,
      reviewCount: (kiyohData.reviews || []).length,
      shopReviewCount: companyData.reviewCount || 0,
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
      shop: {
        rating: companyData.averageRating,
        reviewCount: companyData.reviewCount,
        recommendationPercentage: companyData.recommendationPercentage
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

    // Save to database (non-blocking)
    const questionHash = crypto.createHash('md5')
      .update(question.toLowerCase().trim())
      .digest('hex');

    if (pCode) {
      try {
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
      } catch (err) {
        logger.warn('Failed to save Q&A pair (non-critical):', err.message);
      }
    }

    // Increment question counter
    if (pCode) {
      await cacheService.incrementQuestionCount(locationId, pCode, question);
    }

    // Log analytics
    try {
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
    } catch (err) {
      logger.warn('Failed to log analytics (non-critical):', err.message);
    }

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
    // Check both mapped (text) and raw (description) properties to be safe
    const textContent = review.text || review.description || '';
    const titleContent = review.title || review.oneliner || '';

    const text = `${titleContent} ${textContent}`.toLowerCase();
    let score = 0;

    questionWords.forEach(word => {
      if (text.includes(word)) score += 2;
    });

    // Boost reviews with descriptions
    if (textContent.length > 50) score += 1;

    // Boost recent reviews
    const reviewDate = review.date || review.dateSince;
    if (reviewDate) {
      const daysSince = (Date.now() - new Date(reviewDate)) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) score += 1;
    }

    return { ...review, score, text: textContent, title: titleContent };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(review => ({
      rating: review.rating,
      excerpt: review.text || review.description || '', // Use mapped text
      author: review.author || review.reviewAuthor || 'Klant', // Use mapped author
      date: review.date || review.dateSince
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
