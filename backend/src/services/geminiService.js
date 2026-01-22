const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Google Gemini API Integration
 */
class GeminiService {
  constructor(apiKey, model = 'gemini-2.5-flash') {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 500,
      }
    });
  }

  /**
   * Generate answer based on product reviews
   */
  async generateAnswer(systemInstruction, prompt) {
    try {
      logger.info('Generating answer with Gemini');

      const fullPrompt = `${systemInstruction}\n\n${prompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Calculate confidence based on response characteristics
      const confidence = this.calculateConfidence(text, prompt);

      // Count tokens (approximate)
      const tokensUsed = this.estimateTokens(fullPrompt + text);

      logger.info(`Generated answer with confidence: ${confidence}, tokens: ${tokensUsed}`);

      return {
        answer: text.trim(),
        confidence,
        tokensUsed
      };
    } catch (error) {
      logger.error(`Gemini API error: ${error.message}`);

      if (error.message.includes('API key')) {
        throw new Error('Invalid Gemini API key');
      } else if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded');
      } else {
        throw new Error('Failed to generate answer');
      }
    }
  }

  /**
   * Calculate confidence level based on answer characteristics
   */
  calculateConfidence(answer, prompt) {
    let confidenceScore = 0;

    // Check for review references
    if (answer.match(/reviews?|klanten|beoordelingen/i)) confidenceScore += 2;

    // Check for specific numbers/statistics
    if (answer.match(/\d+/)) confidenceScore += 2;

    // Check for quotes
    if (answer.includes('"') || answer.includes("'")) confidenceScore += 1;

    // Check for uncertainty phrases
    if (answer.match(/niet vermeld|onbekend|geen informatie/i)) confidenceScore -= 2;

    // Length check (very short answers might be uncertain)
    if (answer.length < 50) confidenceScore -= 1;

    if (confidenceScore >= 3) return 'high';
    if (confidenceScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters for English/Dutch
    return Math.ceil(text.length / 4);
  }
}

module.exports = GeminiService;
