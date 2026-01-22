const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Redis caching service
 */
class CacheService {
  constructor() {
    this.ttl = {
      product: parseInt(process.env.CACHE_TTL_PRODUCT) || 86400, // 24 hours
      qa: parseInt(process.env.CACHE_TTL_QA) || 604800, // 7 days
      popular: parseInt(process.env.CACHE_TTL_POPULAR) || 3600, // 1 hour
    };
  }

  /**
   * Get cached data
   */
  async get(key) {
    try {
      const redis = getRedisClient();
      const data = await redis.get(key);

      if (data) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(data);
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set(key, value, ttl) {
    try {
      const redis = getRedisClient();
      await redis.setEx(key, ttl, JSON.stringify(value));
      logger.debug(`Cache set: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Cache product data
   */
  async cacheProduct(locationId, productCode, data) {
    const key = `product:${locationId}:${productCode}`;
    await this.set(key, data, this.ttl.product);
  }

  /**
   * Get cached product data
   */
  async getProduct(locationId, productCode) {
    const key = `product:${locationId}:${productCode}`;
    return await this.get(key);
  }

  /**
   * Cache Q&A pair
   */
  async cacheQA(productCode, question, answer) {
    const questionHash = this.hashQuestion(question);
    const key = `qa:${productCode}:${questionHash}`;
    await this.set(key, answer, this.ttl.qa);
  }

  /**
   * Get cached Q&A
   */
  async getQA(productCode, question) {
    const questionHash = this.hashQuestion(question);
    const key = `qa:${productCode}:${questionHash}`;
    return await this.get(key);
  }

  /**
   * Hash question for cache key (normalize first)
   */
  hashQuestion(question) {
    // Normalize: lowercase, remove punctuation, trim
    const normalized = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Increment question counter for analytics
   */
  async incrementQuestionCount(locationId, productCode, question) {
    try {
      const redis = getRedisClient();
      const key = `stats:${locationId}:${productCode}`;
      await redis.hIncrBy(key, question, 1);
    } catch (error) {
      logger.error(`Error incrementing question count: ${error.message}`);
    }
  }

  /**
   * Get popular questions
   */
  async getPopularQuestions(locationId, limit = 10) {
    try {
      const redis = getRedisClient();
      const pattern = `stats:${locationId}:*`;
      const keys = await redis.keys(pattern);

      const questionsMap = new Map();

      for (const key of keys) {
        const productCode = key.split(':')[2];
        const questions = await redis.hGetAll(key);

        for (const [question, count] of Object.entries(questions)) {
          const existing = questionsMap.get(question) || { count: 0, productCode };
          questionsMap.set(question, {
            question,
            count: existing.count + parseInt(count),
            productCode
          });
        }
      }

      return Array.from(questionsMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      logger.error(`Error getting popular questions: ${error.message}`);
      return [];
    }
  }
}

module.exports = CacheService;
