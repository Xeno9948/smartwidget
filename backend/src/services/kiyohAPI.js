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
  async getProductReviews(locationId, apiToken, options = {}) {
    const { productCode, clusterId, clusterCode } = options;

    const url = new URL(`${this.baseUrl}/v1/publication/product/review/external`);
    url.searchParams.append('locationId', locationId);

    if (productCode) url.searchParams.append('productCode', productCode);
    if (clusterId) url.searchParams.append('clusterId', clusterId);
    if (clusterCode) url.searchParams.append('clusterCode', clusterCode);

    try {
      logger.info(`Fetching Kiyoh reviews for location ${locationId}, product ${productCode || 'all'}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Publication-Api-Token': apiToken,
          'Accept': 'application/json',
          'User-Agent': 'Kiyoh-AI-Widget/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Kiyoh API error: ${response.status} - ${errorText}`);

        if (response.status === 404) {
          throw new Error('Product not found or no reviews available');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API token or unauthorized');
        } else {
          throw new Error(`Kiyoh API error: ${response.status}`);
        }
      }

      const data = await response.json();
      logger.info(`Successfully fetched ${data.reviews?.length || 0} reviews`);

      return this.normalizeResponse(data);
    } catch (error) {
      logger.error(`Error fetching Kiyoh data: ${error.message}`);
      throw error;
    }
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
