const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';

  // Handle specific error types
  if (err.message.includes('Product not found')) {
    return res.status(404).json({
      success: false,
      error: 'Product not found or no reviews available'
    });
  }

  if (err.message.includes('Invalid API token')) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API token'
    });
  }

  if (err.message.includes('quota exceeded')) {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable due to quota limits'
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
}

module.exports = errorHandler;
