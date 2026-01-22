const redis = require('redis');
require('dotenv').config();

let redisClient;

async function initRedis() {
  // Skip Redis if no URL provided
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set - running without Redis (caching disabled)');
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return retries * 100;
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    console.warn('⚠️  Running without Redis - caching disabled');
    return null;
  }
}

function getRedisClient() {
  if (!redisClient) {
    console.warn('Redis client not initialized - caching unavailable');
    return null;
  }
  return redisClient;
}

module.exports = { initRedis, getRedisClient };
