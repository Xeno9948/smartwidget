const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

// Lazy getter for Redis store
function getRedisStore(prefix) {
  if (!process.env.REDIS_URL) return undefined;

  try {
    const client = getRedisClient();
    return new RedisStore({
      client,
      prefix
    });
  } catch (error) {
    // Redis not initialized yet, use in-memory store
    console.warn('Redis not available, using in-memory rate limiting');
    return undefined;
  }
}

// Rate limit per IP
const ipRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_PER_HOUR) || 20,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Lazy Redis store initialization
  store: undefined, // Will use in-memory by default
  skip: () => false
});

// Rate limit per location (for analytics endpoint)
const locationRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.RATE_LIMIT_PER_DAY) || 1000,
  message: {
    success: false,
    error: 'Daily quota exceeded for this location.'
  },
  keyGenerator: (req) => {
    return req.body?.locationId || req.params?.locationId || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Lazy Redis store initialization
  store: undefined // Will use in-memory by default
});

module.exports = { ipRateLimit, locationRateLimit };
