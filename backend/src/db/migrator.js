const pool = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Run database migrations
 */
async function runMigrations() {
    if (!pool) {
        logger.warn('Database not configured - skipping migrations');
        return;
    }

    try {
        logger.info('Running database migrations...');

        const migrationsDir = path.join(__dirname, 'migrations');

        // Check if migrations directory exists
        if (!fs.existsSync(migrationsDir)) {
            logger.warn('Migrations directory not found - skipping');
            return;
        }

        // Get all SQL files
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            logger.info(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            await pool.query(sql);
            logger.info(`✓ Migration ${file} completed`);
        }

        logger.info('✓ All migrations completed successfully');
    } catch (error) {
        logger.error('Migration error:', error);
        throw error;
    }
}

module.exports = { runMigrations };
