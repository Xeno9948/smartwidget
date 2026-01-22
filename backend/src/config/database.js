const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

// Only create pool if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err);
      console.warn('⚠️  PostgreSQL unavailable - Q&A history will not be persisted');
    } else {
      console.log('✓ Database connected successfully');
    }
  });
} else {
  console.warn('⚠️  DATABASE_URL not set - running without PostgreSQL (Q&A history disabled)');
}

module.exports = pool;
