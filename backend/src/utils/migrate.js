/**
 * Database migration script
 * Run with: node src/utils/migrate.js
 */
const pool = require('../config/database');
const logger = require('./logger');

async function migrate() {
  try {
    logger.info('Starting database migration...');

    // Create qa_pairs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qa_pairs (
        id SERIAL PRIMARY KEY,
        location_id VARCHAR(50) NOT NULL,
        product_code VARCHAR(50) NOT NULL,
        question TEXT NOT NULL,
        question_hash VARCHAR(64) NOT NULL,
        answer TEXT NOT NULL,
        confidence VARCHAR(20),
        language VARCHAR(5) DEFAULT 'nl',
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    logger.info('✓ Created qa_pairs table');

    // Create indexes for qa_pairs
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_qa_product ON qa_pairs(product_code)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_qa_hash ON qa_pairs(question_hash)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_qa_location ON qa_pairs(location_id)
    `);

    logger.info('✓ Created indexes for qa_pairs');

    // Create analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        location_id VARCHAR(50) NOT NULL,
        product_code VARCHAR(50),
        question TEXT,
        answer_provided BOOLEAN DEFAULT false,
        cached BOOLEAN DEFAULT false,
        response_time_ms INTEGER,
        error TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    logger.info('✓ Created analytics table');

    // Create indexes for analytics
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_location ON analytics(location_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(created_at)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_product ON analytics(product_code)
    `);

    logger.info('✓ Created indexes for analytics');

    logger.info('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

migrate();
