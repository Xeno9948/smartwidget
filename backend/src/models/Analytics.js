const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Analytics model for tracking widget usage
 */
class Analytics {
  /**
   * Log analytics event
   */
  static async log(data) {
    const {
      locationId,
      productCode,
      question,
      answerProvided,
      cached,
      responseTimeMs,
      error,
      ipAddress,
      userAgent
    } = data;

    const query = `
      INSERT INTO analytics (
        location_id, product_code, question, answer_provided,
        cached, response_time_ms, error, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [
        locationId,
        productCode,
        question,
        answerProvided,
        cached,
        responseTimeMs,
        error,
        ipAddress,
        userAgent
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`Error logging analytics: ${error.message}`);
      // Don't throw - analytics shouldn't break the main flow
    }
  }

  /**
   * Get analytics summary for location
   */
  static async getSummary(locationId, days = 30) {
    const query = `
      SELECT
        COUNT(*) as total_questions,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as questions_today,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE cached = true) * 100.0 / NULLIF(COUNT(*), 0) as cache_hit_rate,
        COUNT(*) FILTER (WHERE error IS NOT NULL) as error_count
      FROM analytics
      WHERE location_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
    `;

    try {
      const result = await pool.query(query, [locationId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching analytics summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get popular products
   */
  static async getPopularProducts(locationId, limit = 10) {
    const query = `
      SELECT
        product_code,
        COUNT(*) as question_count
      FROM analytics
      WHERE location_id = $1 AND product_code IS NOT NULL
      GROUP BY product_code
      ORDER BY question_count DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [locationId, limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching popular products: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Analytics;
