const express = require('express');
const router = express.Router();
const KiyohAPI = require('../services/kiyohAPI');
const customerService = require('../services/customerService');
const logger = require('../utils/logger');

const kiyohAPI = new KiyohAPI(process.env.KIYOH_BASE_URL);

/**
 * GET /shop/:locationId/rating
 * Fetch shop rating for initial widget display
 */
router.get('/:locationId/rating', async (req, res) => {
    try {
        const { locationId } = req.params;

        // Get customer to retrieve API token
        const customer = await customerService.getCustomerByLocationId(locationId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }

        const apiToken = customer.api_token;

        // Fetch company reviews from Kiyoh
        const companyData = await kiyohAPI.getCompanyReviews(locationId, apiToken);

        res.json({
            success: true,
            data: {
                rating: companyData.averageRating || 0,
                reviewCount: companyData.reviewCount || 0,
                recommendationPercentage: companyData.recommendationPercentage || 0
            }
        });

    } catch (error) {
        logger.error(`Error fetching shop rating: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shop rating'
        });
    }
});

module.exports = router;
