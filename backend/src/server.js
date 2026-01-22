require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { initRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const { healthCheck } = require('./controllers/healthController');
const qaRoutes = require('./routes/qa');
const analyticsRoutes = require('./routes/analytics');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve widget files statically
const widgetPath = path.join(__dirname, '../../widget/dist');
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

start();
