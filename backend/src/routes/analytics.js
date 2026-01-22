const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { validateToken } = require('../middleware/auth');

// Get analytics for a location (requires authentication)
router.get('/:locationId', validateToken, getAnalytics);

module.exports = router;
