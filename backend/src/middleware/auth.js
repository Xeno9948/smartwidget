const logger = require('../utils/logger');

/**
 * Validate API token from request
 */
function validateToken(req, res, next) {
  const token = req.body?.apiToken || req.headers['x-api-token'];

  if (!token) {
    logger.warn('Missing API token in request');
    return res.status(401).json({
      success: false,
      error: 'API token is required'
    });
  }

  // Store token in request for later use
  req.apiToken = token;
  next();
}

/**
 * Validate required fields in request body
 */
function validateQARequest(req, res, next) {
  const { locationId, question } = req.body;

  if (!locationId) {
    return res.status(400).json({
      success: false,
      error: 'locationId is required'
    });
  }

  if (!question || question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'question is required'
    });
  }

  if (question.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'question must be 500 characters or less'
    });
  }

  next();
}

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(req, res, next) {
  if (req.body.question) {
    // Remove any potentially dangerous characters
    req.body.question = req.body.question
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  if (req.body.productCode) {
    // GTIN should only contain digits
    req.body.productCode = req.body.productCode.replace(/\D/g, '');
  }

  next();
}

module.exports = { validateToken, validateQARequest, sanitizeInput };
