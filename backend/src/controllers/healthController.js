const pool = require('../config/database');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  const health = {
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check database
  try {
    await pool.query('SELECT NOW()');
    health.services.database = 'ok';
  } catch (error) {
    logger.error(`Database health check failed: ${error.message}`);
    health.services.database = 'error';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.services.redis = 'ok';
  } catch (error) {
    logger.error(`Redis health check failed: ${error.message}`);
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  // Check Gemini API (just check if key is set)
  health.services.gemini = process.env.GEMINI_API_KEY ? 'configured' : 'not configured';

  // Return 200 even if degraded so we can debug (and container stays alive)
  // But include the status in the body
  res.json(health);
}

module.exports = { healthCheck };
