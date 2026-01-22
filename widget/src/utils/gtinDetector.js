/**
 * GTIN Auto-Detection Utility
 * Automatically detects GTIN/EAN from various sources on the page
 */

class GTINDetector {
  /**
   * Main detection method - tries all strategies
   */
  static async detect() {
    const strategies = [
      this.detectFromJSONLD,
      this.detectFromMetaTags,
      this.detectFromMicrodata,
      this.detectFromDataAttributes,
      this.detectFromPlatformSpecific
    ];

    for (const strategy of strategies) {
      try {
        const gtin = await strategy.call(this);
        if (gtin && this.validateGTIN(gtin)) {
          console.log(`[GTINDetector] Found GTIN: ${gtin} using ${strategy.name}`);
          return gtin;
        }
      } catch (error) {
        console.warn(`[GTINDetector] Error in ${strategy.name}:`, error);
      }
    }

    console.warn('[GTINDetector] No valid GTIN found');
    return null;
  }

  /**
   * Strategy 1: JSON-LD structured data (Schema.org)
   */
  static detectFromJSONLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const gtin = this.findGTINInObject(data);
        if (gtin) return gtin;
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Recursively search for GTIN fields in JSON object
   */
  static findGTINInObject(obj) {
    if (!obj || typeof obj !== 'object') return null;

    const gtinFields = ['gtin', 'gtin13', 'gtin12', 'gtin14', 'gtin8', 'ean', 'isbn'];

    for (const field of gtinFields) {
      if (obj[field]) return String(obj[field]);
    }

    // Search in nested objects and arrays
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const result = this.findGTINInObject(obj[key]);
        if (result) return result;
      }
    }

    return null;
  }

  /**
   * Strategy 2: Meta tags
   */
  static detectFromMetaTags() {
    const metaSelectors = [
      'meta[property="product:gtin"]',
      'meta[property="og:product:gtin"]',
      'meta[property="product:ean"]',
      'meta[name="gtin"]',
      'meta[name="gtin13"]',
      'meta[name="ean"]',
      'meta[itemprop="gtin"]',
      'meta[itemprop="gtin13"]'
    ];

    for (const selector of metaSelectors) {
      const meta = document.querySelector(selector);
      if (meta) {
        const content = meta.getAttribute('content');
        if (content) return content;
      }
    }

    return null;
  }

  /**
   * Strategy 3: Microdata attributes
   */
  static detectFromMicrodata() {
    const microdataSelectors = [
      '[itemprop="gtin"]',
      '[itemprop="gtin13"]',
      '[itemprop="gtin12"]',
      '[itemprop="gtin14"]',
      '[itemprop="gtin8"]',
      '[itemprop="ean"]'
    ];

    for (const selector of microdataSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const value = element.getAttribute('content') || element.textContent;
        if (value) return value.trim();
      }
    }

    return null;
  }

  /**
   * Strategy 4: Data attributes
   */
  static detectFromDataAttributes() {
    const dataSelectors = [
      '[data-gtin]',
      '[data-ean]',
      '[data-product-gtin]',
      '[data-product-ean]',
      '[data-product-code]'
    ];

    for (const selector of dataSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const attrs = ['data-gtin', 'data-ean', 'data-product-gtin', 'data-product-ean', 'data-product-code'];
        for (const attr of attrs) {
          const value = element.getAttribute(attr);
          if (value) return value;
        }
      }
    }

    return null;
  }

  /**
   * Strategy 5: Platform-specific selectors
   */
  static detectFromPlatformSpecific() {
    // WooCommerce
    const wooSku = document.querySelector('.product_meta .sku');
    if (wooSku && this.looksLikeGTIN(wooSku.textContent)) {
      return wooSku.textContent.trim();
    }

    // Shopify
    if (window.ShopifyAnalytics?.meta?.product?.variants) {
      const sku = window.ShopifyAnalytics.meta.product.variants[0]?.sku;
      if (sku && this.looksLikeGTIN(sku)) return sku;
    }

    // Magento
    if (window.dlv_dataLayer?.product?.sku) {
      const sku = window.dlv_dataLayer.product.sku;
      if (this.looksLikeGTIN(sku)) return sku;
    }

    // Lightspeed
    const lightspeedEan = document.querySelector('.product-ean, .product__ean');
    if (lightspeedEan) return lightspeedEan.textContent.trim();

    return null;
  }

  /**
   * Check if a string looks like a GTIN (8, 12, 13, or 14 digits)
   */
  static looksLikeGTIN(str) {
    if (!str) return false;
    const digits = str.replace(/\D/g, '');
    return [8, 12, 13, 14].includes(digits.length);
  }

  /**
   * Validate GTIN format and checksum
   */
  static validateGTIN(gtin) {
    if (!gtin) return false;

    // Remove any non-digit characters
    const digits = String(gtin).replace(/\D/g, '');

    // Check length (8, 12, 13, or 14 digits)
    if (![8, 12, 13, 14].includes(digits.length)) {
      return false;
    }

    // Validate checksum (GS1 algorithm)
    return this.validateChecksum(digits);
  }

  /**
   * Validate GTIN checksum using GS1 algorithm
   */
  static validateChecksum(digits) {
    const arr = digits.split('').map(Number);
    const checkDigit = arr.pop();

    let sum = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      const multiplier = (arr.length - i) % 2 === 0 ? 3 : 1;
      sum += arr[i] * multiplier;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }
}

export default GTINDetector;
