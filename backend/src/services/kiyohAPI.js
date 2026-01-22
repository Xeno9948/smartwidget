const logger = require('../utils/logger');

/**
 * Kiyoh Product Reviews API Integration
 */
class KiyohAPI {
  constructor(baseUrl = 'https://www.kiyoh.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch product reviews from Kiyoh
   * @param {string} locationId - Customer's Kiyoh location ID
   * @param {string} apiToken - Kiyoh API token
   * @param {object} options - Additional options (productCode, clusterId, etc.)
   */
  async getProductReviews(locationId, apiToken, { productCode, productName }) {
    try {
      if (productCode) {
        // Try getting reviews by GTIN/product code first
        try {
          const response = await fetch(`${this.baseUrl}/v1/publication/product/review/external?locationId=${locationId}&productCode=${productCode}&include_attributes=true`, {
            headers: {
              'X-Publication-Api-Token': apiToken,
              'Accept': 'application/json',
              'User-Agent': 'Kiyoh-AI-Widget/1.0'
            }
          });

          if (response.ok) {
            const data = await response.json();
            return this.normalizeResponse(data);
          }

          if (!productName) throw new Error(`Kiyoh API error: ${response.status}`);
          logger.info('GTIN lookup failed, trying fuzzy match with name:', productName);
        } catch (error) {
          if (!productName) throw error;
        }
      }

      if (productName) {
        // Fallback: Get all recent reviews and fuzzy match by name
        const response = await fetch(`${this.baseUrl}/v1/publication/product/review/external?locationId=${locationId}&limit=100&include_attributes=true`, {
          headers: {
            'X-Publication-Api-Token': apiToken,
            'Accept': 'application/json',
            'User-Agent': 'Kiyoh-AI-Widget/1.0'
          }
        });

        if (!response.ok) throw new Error(`Kiyoh API error: ${response.status}`);

        const data = await response.json();
        const allReviews = this.normalizeResponse(data);
        const matchingReviews = this.fuzzyMatchProduct(allReviews.reviews, productName);

        return {
          ...allReviews,
          reviews: matchingReviews,
          reviewCount: matchingReviews.length,
          averageRating: this.calculateAverageRating(matchingReviews)
        };
      }

      throw new Error('No product identifier provided');
    } catch (error) {
      logger.error(`Error fetching Kiyoh data: ${error.message}`);
      return { reviews: [], averageRating: 0, reviewCount: 0 };
    }
  }

  fuzzyMatchProduct(reviews, productName) {
    if (!productName) return [];

    const normalizedTarget = productName.toLowerCase();
    const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 3);

    if (targetWords.length === 0) return [];

    return reviews.filter(r => {
      const reviewProduct = (r.productName || '').toLowerCase();
      if (!reviewProduct) return false;

      // Direct inclusion check
      if (reviewProduct.includes(normalizedTarget) || normalizedTarget.includes(reviewProduct)) {
        return true;
      }

      // Word overlap check (at least 70% of words match)
      const reviewWords = reviewProduct.split(/\s+/);
      const matches = targetWords.filter(tw => reviewWords.some(rw => rw.includes(tw)));
      return matches.length / targetWords.length >= 0.7;
    });
  }

  calculateAverageRating(reviews) {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  /**
   * Normalize Kiyoh API response
   */
  normalizeResponse(data) {
    return {
      locationId: data.locationId,
      clusterId: data.clusterId,
      products: data.locationProduct || [],
      averageRating: data.averageRating || 0,
      reviewCount: data.numberReviews || 0,
      reviews: (data.reviews || []).map(review => ({
        reviewId: review.reviewId,
        productReviewId: review.productReviewId,
        reviewAuthor: review.reviewAuthor || 'Anoniem',
        city: review.city,
        rating: review.rating,
        dateSince: review.dateSince,
        updatedSince: review.updatedSince,
        oneliner: review.oneliner || '',
        description: review.description || '',
        language: review.reviewLanguage || 'nl',
        notApplicable: review.notApplicable || false
      }))
    };
  }

  /**
   * Extract product information
   */
  getProductInfo(kiyohData, productCode) {
    if (!kiyohData.products || kiyohData.products.length === 0) {
      return {
        productName: 'Unknown Product',
        gtin: productCode,
        imageUrl: null,
        sourceUrl: null
      };
    }

    const product = kiyohData.products.find(p => p.productCode === productCode) || kiyohData.products[0];

    if (!product) {
      return {
        productName: 'Unknown Product',
        gtin: productCode,
        imageUrl: null,
        sourceUrl: null
      };
    }

    return {
      productName: product.productName,
      gtin: product.productCode,
      imageUrl: product.image_url,
      sourceUrl: product.source_url,
      active: product.active
    };
  }
}

module.exports = KiyohAPI;
