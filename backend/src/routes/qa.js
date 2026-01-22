const express = require('express');
const router = express.Router();
const {
  handleQuestion,
  getPopularQuestions,
  getQAHistory
} = require('../controllers/qaController');
const {
  validateToken,
  validateQARequest,
  sanitizeInput
} = require('../middleware/auth');
const { ipRateLimit, locationRateLimit } = require('../middleware/rateLimit');

// Main Q&A endpoint
router.post(
  '/',
  ipRateLimit,
  locationRateLimit,
  validateToken,
  sanitizeInput,
  validateQARequest,
  handleQuestion
);

// Get popular questions for a location
router.get('/popular/:locationId', getPopularQuestions);

// Get Q&A history for a product
router.get('/history/:productCode', getQAHistory);

module.exports = router;
