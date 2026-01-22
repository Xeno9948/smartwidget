const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Q&A Pair model for database operations
 */
class QAPair {
  /**
   * Save Q&A pair to database
   */
  static async create(data) {
    const {
      locationId,
      productCode,
      question,
      questionHash,
      answer,
      confidence,
      language,
      tokensUsed
    } = data;

    const query = `
      INSERT INTO qa_pairs (
        location_id, product_code, question, question_hash,
        answer, confidence, language, tokens_used
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        locationId,
        productCode,
        question,
        questionHash,
        answer,
        confidence,
        language,
        tokensUsed
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error(`Error saving Q&A pair: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Q&A history for a product
   */
  static async getByProduct(productCode, limit = 20) {
    const query = `
      SELECT * FROM qa_pairs
      WHERE product_code = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [productCode, limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching Q&A history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get popular questions by location
   */
  static async getPopularByLocation(locationId, limit = 10) {
    const query = `
      SELECT question, COUNT(*) as times_asked, product_code
      FROM qa_pairs
      WHERE location_id = $1
      GROUP BY question, product_code
      ORDER BY times_asked DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [locationId, limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching popular questions: ${error.message}`);
      throw error;
    }
  }
}

module.exports = QAPair;
