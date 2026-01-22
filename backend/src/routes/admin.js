const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const logger = require('../utils/logger');

/**
 * Middleware to verify admin API key
 */
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
        return res.status(500).json({
            success: false,
            error: 'Admin API not configured. Set ADMIN_API_KEY environment variable.'
        });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.substring(7);
    if (token !== adminKey) {
        return res.status(403).json({
            success: false,
            error: 'Invalid admin API key'
        });
    }

    next();
}

/**
 * POST /admin/customers - Create new customer
 */
router.post('/customers', requireAdminAuth, async (req, res) => {
    try {
        const { location_id, api_token, company_name } = req.body;

        // Validation
        if (!location_id || !api_token) {
            return res.status(400).json({
                success: false,
                error: 'location_id and api_token are required'
            });
        }

        const customer = await customerService.createCustomer({
            locationId: location_id,
            apiToken: api_token,
            companyName: company_name
        });

        res.status(201).json({
            success: true,
            data: customer
        });
    } catch (error) {
        logger.error('Admin API - Create customer error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /admin/customers - List all customers
 */
router.get('/customers', requireAdminAuth, async (req, res) => {
    try {
        const customers = await customerService.getAllCustomers();
        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        logger.error('Admin API - List customers error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /admin/customers/:locationId - Get specific customer
 */
router.get('/customers/:locationId', requireAdminAuth, async (req, res) => {
    try {
        const customer = await customerService.getCustomerByLocationId(req.params.locationId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        logger.error('Admin API - Get customer error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /admin/customers/:locationId - Update customer
 */
router.put('/customers/:locationId', requireAdminAuth, async (req, res) => {
    try {
        const { api_token, company_name, active } = req.body;

        const customer = await customerService.updateCustomer(
            req.params.locationId,
            {
                apiToken: api_token,
                companyName: company_name,
                active
            }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        logger.error('Admin API - Update customer error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /admin/customers/:locationId - Deactivate customer
 */
router.delete('/customers/:locationId', requireAdminAuth, async (req, res) => {
    try {
        const customer = await customerService.deactivateCustomer(req.params.locationId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer deactivated successfully',
            data: customer
        });
    } catch (error) {
        logger.error('Admin API - Delete customer error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
