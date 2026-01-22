const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

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
  // Use Redis store if available, otherwise in-memory
  store: process.env.REDIS_URL ? new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:ip:'
  }) : undefined
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
  store: process.env.REDIS_URL ? new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:loc:'
  }) : undefined
});

module.exports = { ipRateLimit, locationRateLimit };
