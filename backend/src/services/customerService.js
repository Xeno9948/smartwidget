const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Customer Service - Handles customer CRUD operations and API token lookups
 */
class CustomerService {
    /**
     * Get customer by location ID
     */
    async getCustomerByLocationId(locationId) {
        if (!pool) {
            throw new Error('Database not available. PostgreSQL required for customer management.');
        }

        try {
            const result = await pool.query(
                'SELECT * FROM customers WHERE location_id = $1 AND active = true',
                [locationId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            logger.error(`Error fetching customer ${locationId}:`, error);
            throw new Error('Failed to fetch customer');
        }
    }

    /**
     * Create new customer
     */
    async createCustomer({ locationId, apiToken, companyName }) {
        if (!pool) {
            throw new Error('Database not available. PostgreSQL required for customer management.');
        }

        try {
            const result = await pool.query(
                `INSERT INTO customers (location_id, api_token, company_name)
         VALUES ($1, $2, $3)
         RETURNING id, location_id, company_name, active, created_at`,
                [locationId, apiToken, companyName]
            );

            logger.info(`Created customer: ${locationId}`);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Customer with this location ID already exists');
            }
            logger.error('Error creating customer:', error);
            throw new Error('Failed to create customer');
        }
    }

    /**
     * Update existing customer
     */
    async updateCustomer(locationId, updates) {
        if (!pool) {
            throw new Error('Database not available. PostgreSQL required for customer management.');
        }

        const { apiToken, companyName, active } = updates;
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (apiToken !== undefined) {
            fields.push(`api_token = $${paramCount++}`);
            values.push(apiToken);
        }
        if (companyName !== undefined) {
            fields.push(`company_name = $${paramCount++}`);
            values.push(companyName);
        }
        if (active !== undefined) {
            fields.push(`active = $${paramCount++}`);
            values.push(active);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(locationId);

        try {
            const result = await pool.query(
                `UPDATE customers 
         SET ${fields.join(', ')}
         WHERE location_id = $${paramCount}
         RETURNING id, location_id, company_name, active, updated_at`,
                values
            );

            if (result.rows.length === 0) {
                return null;
            }

            logger.info(`Updated customer: ${locationId}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error updating customer ${locationId}:`, error);
            throw new Error('Failed to update customer');
        }
    }

    /**
     * Deactivate customer (soft delete)
     */
    async deactivateCustomer(locationId) {
        return this.updateCustomer(locationId, { active: false });
    }

    /**
     * Get all active customers
     */
    async getAllCustomers() {
        if (!pool) {
            throw new Error('Database not available. PostgreSQL required for customer management.');
        }

        try {
            const result = await pool.query(
                'SELECT id, location_id, company_name, active, created_at FROM customers ORDER BY created_at DESC'
            );
            return result.rows;
        } catch (error) {
            logger.error('Error fetching customers:', error);
            throw new Error('Failed to fetch customers');
        }
    }
}

module.exports = new CustomerService();
