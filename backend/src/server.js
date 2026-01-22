require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { initRedis } = require('./config/redis');
const { runMigrations } = require('./db/migrator');
const errorHandler = require('./middleware/errorHandler');
const { healthCheck } = require('./controllers/healthController');
const qaRoutes = require('./routes/qa');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for Railway/Heroku/AWS load balancers
// This fixes: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS === '*'
    ? '*'
    : process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/api/health', healthCheck);
app.get('/health', healthCheck);

// API routes
app.use('/api/v1/qa', qaRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/admin', adminRoutes); // Admin API for customer management

// Serve widget files statically
const fs = require('fs');
// Try local path first
let widgetPath = path.join(__dirname, '../../widget/dist');
// If not found, try Docker path
if (!fs.existsSync(widgetPath)) {
  widgetPath = path.join(__dirname, '../widget/dist');
}
logger.info(`Serving widget files from: ${widgetPath}`);

app.use('/widget', express.static(widgetPath, {
  setHeaders: (res, filepath) => {
    // Enable CORS for widget files
    res.set('Access-Control-Allow-Origin', '*');
    // Cache widget files for 1 hour
    if (filepath.endsWith('.js') || filepath.endsWith('.css')) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Kiyoh AI Q&A Widget API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      qa: '/api/v1/qa',
      popularQuestions: '/api/v1/qa/popular/:locationId',
      qaHistory: '/api/v1/qa/history/:productCode',
      analytics: '/api/v1/analytics/:locationId'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function start() {
  try {
    // Run database migrations (if PostgreSQL is available)
    try {
      await runMigrations();
    } catch (error) {
      logger.warn(`Migration warning: ${error.message} - continuing without migrations`);
    }

    // Initialize Redis (optional)
    try {
      await initRedis();
      if (process.env.REDIS_URL) {
        logger.info('✓ Redis initialized');
      }
    } catch (error) {
      logger.warn(`Redis initialization failed: ${error.message} - continuing without cache`);
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API ready at http://localhost:${PORT}/api/v1/qa`);
      logger.info(`✓ Admin API ready at http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Diagnostics Endpoint (Protected by Admin Key logic if possible, or just open for debugging temporarily)
app.get('/admin/diagnose', async (req, res) => {
  // Check auth header manually here for safety
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.ADMIN_API_KEY) {
    // Allow it temporarily if ADMIN_API_KEY is not set, otherwise 401
    if (process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `Present (${process.env.GEMINI_API_KEY.substring(0, 4)}...)` : 'MISSING ❌',
      DATABASE_URL: process.env.DATABASE_URL ? 'Present' : 'MISSING ❌',
      ADMIN_API_KEY: process.env.ADMIN_API_KEY ? 'Present' : 'MISSING ⚠️',
      KIYOH_BASE_URL: process.env.KIYOH_BASE_URL || 'Default'
    },
    database: {
      status: 'Unknown',
      customerCount: 0,
      customers: []
    }
  };

  try {
    const pool = require('./config/database');
    if (pool) {
      const result = await pool.query('SELECT location_id, company_name, length(api_token) as token_len FROM customers');
      diagnostics.database.status = 'Connected ✅';
      diagnostics.database.customerCount = result.rowCount;
      diagnostics.database.customers = result.rows;
    } else {
      diagnostics.database.status = 'Pool not initialized ❌';
    }
  } catch (err) {
    diagnostics.database.status = `Error: ${err.message} ❌`;
  }

  res.json(diagnostics);
});

start();
