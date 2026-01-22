const logger = require('../utils/logger');

/**
 * Kiyoh Product Reviews API Integration
 * Uses official Kiyoh Publication API with XML feed
 */
class KiyohAPI {
  constructor(baseUrl = 'https://www.kiyoh.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch product reviews from Kiyoh
   * @param {string} locationId - Customer's Kiyoh location ID (connectorcode)
   * @param {string} apiToken - Kiyoh API token (hash)
   * @param {object} options - Additional options (productCode, productName)
   */
  async getProductReviews(locationId, apiToken, { productCode, productName }) {
    try {
      // Build URL with correct query parameters
      const url = `${this.baseUrl}/v1/publication/review/feed.xml?connectorcode=${locationId}&hash=${apiToken}&limit=100`;

      logger.info(`Fetching Kiyoh reviews from: ${this.baseUrl}/v1/publication/review/feed.xml`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Kiyoh-AI-Widget/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Kiyoh API error: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parsedData = this.parseXMLFeed(xmlText);

      logger.info(`Kiyoh returned ${parsedData.reviews.length} reviews`);

      // Filter by product if specified
      if (productCode || productName) {
        const filtered = this.filterByProduct(parsedData.reviews, productCode, productName);
        return {
          ...parsedData,
          reviews: filtered,
          reviewCount: filtered.length,
          averageRating: this.calculateAverageRating(filtered)
        };
      }

      return parsedData;
    } catch (error) {
      logger.error(`Error fetching Kiyoh data: ${error.message}`);
      logger.info(`Kiyoh API returned empty/error - continuing without reviews`);
      return { reviews: [], averageRating: 0, reviewCount: 0, shopRating: 0 };
    }
  }

  /**
   * Parse Kiyoh XML feed
   */
  parseXMLFeed(xmlText) {
    const reviews = [];
    let shopRating = 0;
    let totalReviews = 0;

    try {
      // Extract shop rating
      const ratingMatch = xmlText.match(/<averageRating>([\d.]+)<\/averageRating>/);
      if (ratingMatch) shopRating = parseFloat(ratingMatch[1]);

      const countMatch = xmlText.match(/<numberReviews>(\d+)<\/numberReviews>/);
      if (countMatch) totalReviews = parseInt(countMatch[1]);

      // Extract individual reviews
      const reviewMatches = xmlText.matchAll(/<review>(.*?)<\/review>/gs);

      for (const match of reviewMatches) {
        const reviewXml = match[1];

        const review = {
          rating: this.extractTag(reviewXml, 'rating'),
          title: this.extractTag(reviewXml, 'title'),
          text: this.extractTag(reviewXml, 'reviewText'),
          author: this.extractTag(reviewXml, 'reviewAuthor'),
          date: this.extractTag(reviewXml, 'datePublished'),
          productCode: this.extractTag(reviewXml, 'productCode'),
          productName: this.extractTag(reviewXml, 'productName')
        };

        if (review.text || review.title) {
          reviews.push(review);
        }
      }

      return {
        reviews,
        shopRating,
        totalReviews,
        averageRating: shopRating,
        reviewCount: reviews.length
      };
    } catch (error) {
      logger.error(`XML parsing error: ${error.message}`);
      return { reviews: [], averageRating: 0, reviewCount: 0, shopRating: 0 };
    }
  }

  /**
   * Extract tag value from XML
   */
  extractTag(xml, tagName) {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Filter reviews by product
   */
  filterByProduct(reviews, productCode, productName) {
    if (!productCode && !productName) return reviews;

    return reviews.filter(review => {
      // Exact match on product code
      if (productCode && review.productCode === productCode) return true;

      // Fuzzy match on product name
      if (productName && review.productName) {
        const normalizedReview = review.productName.toLowerCase();
        const normalizedTarget = productName.toLowerCase();
        const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 3);

        return targetWords.some(word => normalizedReview.includes(word));
      }

      return false;
    });
  }

  /**
   * Calculate average rating
   */
  calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, review) => {
      const rating = parseFloat(review.rating);
      return acc + (isNaN(rating) ? 0 : rating);
    }, 0);

    return (sum / reviews.length).toFixed(1);
  }

  /**
   * Get product info (for compatibility)
   */
  getProductInfo(kiyohData, productCode) {
    if (!kiyohData.reviews || kiyohData.reviews.length === 0) {
      return {
        productName: 'Unknown Product',
        gtin: productCode,
        imageUrl: null,
        sourceUrl: null
      };
    }

    const product = kiyohData.reviews.find(r => r.productCode === productCode) || kiyohData.reviews[0];

    return {
      productName: product.productName || 'Unknown Product',
      gtin: product.productCode || productCode,
      imageUrl: null,
      sourceUrl: null
    };
  }
}

module.exports = KiyohAPI;
