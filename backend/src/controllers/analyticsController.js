const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');

/**
 * Get analytics summary for a location
 */
async function getAnalytics(req, res, next) {
  try {
    const { locationId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const summary = await Analytics.getSummary(locationId, days);
    const popularProducts = await Analytics.getPopularProducts(locationId, 10);

    res.json({
      success: true,
      data: {
        totalQuestions: parseInt(summary.total_questions) || 0,
        questionsToday: parseInt(summary.questions_today) || 0,
        averageResponseTime: Math.round(summary.avg_response_time) || 0,
        cacheHitRate: parseFloat(summary.cache_hit_rate) || 0,
        errorCount: parseInt(summary.error_count) || 0,
        popularProducts: popularProducts.map(p => ({
          productCode: p.product_code,
          questionCount: parseInt(p.question_count)
        })),
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAnalytics };
