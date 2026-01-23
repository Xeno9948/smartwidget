const logger = require('../utils/logger');

/**
 * Kiyoh Product Reviews API Integration
 * Based on KV & Kiyoh Product Reviews API Documentation
 */
class KiyohAPI {
  constructor(baseUrl = 'https://www.kiyoh.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch product reviews from Kiyoh
   * @param {string} locationId - Customer's Kiyoh location ID
   * @param {string} apiToken - Kiyoh Publication API token
   * @param {object} options - Additional options (productCode)
   */
  async getProductReviews(locationId, apiToken, { productCode }) {
    try {
      if (!productCode) {
        logger.warn('Skipping Kiyoh fetch: No product code provided');
        return this.getEmptyResult();
      }

      // Endpoint from PDF Page 6:
      // GET https://<baseurl>/v1/publication/product/review/external?locationId=[id]&productCode=[code]
      // Note: encodeURIComponent is important for product codes
      const url = `${this.baseUrl}/v1/publication/product/review/external?locationId=${locationId}&productCode=${encodeURIComponent(productCode)}`;

      logger.info(`Fetching Kiyoh reviews from: ${url}`);
      logger.info(`DEBUG: productCode raw="${productCode}", encoded="${encodeURIComponent(productCode)}"`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Publication-Api-Token': apiToken
        }
      });

      if (!response.ok) {
        // Log the full error text for debugging
        const text = await response.text();
        throw new Error(`Kiyoh API error: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      const reviews = data.reviews || [];
      logger.info(`Kiyoh returned ${reviews.length} reviews`);

      return {
        reviews: this.mapReviews(reviews),
        reviewCount: data.numberReviews || 0,
        averageRating: data.averageRating || 0,
        shopRating: data.averageRating || 0, // Fallback shop rating to product rating
        productName: data.locationProduct?.[0]?.productName
      };

    } catch (error) {
      logger.error(`Error fetching Kiyoh data: ${error.message}`);
      return this.getEmptyResult();
    }
  }

  /**
   * Fetch company (shop) reviews from Kiyoh
   * @param {string} locationId - Customer's Kiyoh location ID
   * @param {string} apiToken - Kiyoh Publication API token
   */
  async getCompanyReviews(locationId, apiToken) {
    try {
      // Endpoint Assumption: Same structure but for company reviews (no productCode)
      // GET https://<baseurl>/v1/publication/review/external?locationId=[id]
      const url = `${this.baseUrl}/v1/publication/review/external?locationId=${locationId}`;

      logger.info(`Fetching Kiyoh company reviews from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Publication-Api-Token': apiToken
        }
      });

      if (!response.ok) {
        // Log the full error text for debugging
        const text = await response.text();
        // If 404, it might just mean no reviews, but usually 200 with empty list is expected
        logger.warn(`Kiyoh company reviews error: ${response.status} ${response.statusText}`);
        return this.getEmptyResult();
      }

      const data = await response.json();
      const reviews = data.reviews || [];
      logger.info(`Kiyoh returned ${reviews.length} company reviews`);

      return {
        reviews: this.mapReviews(reviews),
        reviewCount: data.numberReviews || 0,
        averageRating: data.averageRating || 0,
        recommendationPercentage: data.recommendationPercentage || 0
      };

    } catch (error) {
      logger.error(`Error fetching Kiyoh company reviews: ${error.message}`);
      return this.getEmptyResult();
    }
  }

  mapReviews(rawReviews) {
    return rawReviews.map(r => ({
      rating: r.rating,
      title: r.oneliner,
      text: r.description,
      author: r.reviewAuthor,
      date: r.dateSince,
      city: r.city,
      language: r.reviewLanguage
    }));
  }

  getEmptyResult() {
    return {
      reviews: [],
      averageRating: 0,
      reviewCount: 0,
      shopRating: 0
    };
  }

  /**
   * Get product info helper
   */
  getProductInfo(kiyohData, productCode) {
    return {
      productName: kiyohData.productName || 'Unknown Product',
      gtin: productCode,
      imageUrl: null,
      sourceUrl: null
    };
  }
}

module.exports = KiyohAPI;
