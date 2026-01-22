/**
 * Enhanced Product Detector
 * Tries multiple strategies to identify product: GTIN → Name → SKU → ID
 */

class ProductDetector {
    /**
     * Detect product using multiple strategies
     */
    static async detect() {
        console.log('[ProductDetector] Starting multi-strategy detection...');

        // Try GTIN first (most reliable)
        const gtin = await this.detectGTIN();
        if (gtin) {
            console.log('[ProductDetector] ✓ Found GTIN:', gtin);
            return { type: 'gtin', value: gtin };
        }

        // Try product name
        const name = await this.detectProductName();
        if (name) {
            console.log('[ProductDetector] ✓ Found product name:', name);
            return { type: 'name', value: name };
        }

        // Try SKU
        const sku = await this.detectSKU();
        if (sku) {
            console.log('[ProductDetector] ✓ Found SKU:', sku);
            return { type: 'sku', value: sku };
        }

        // Try product ID from URL
        const id = await this.detectProductId();
        if (id) {
            console.log('[ProductDetector] ✓ Found product ID:', id);
            return { type: 'id', value: id };
        }

        console.warn('[ProductDetector] ✗ No product identifier found');
        return null;
    }

    /**
     * Detect GTIN/EAN from various sources
     */
    static async detectGTIN() {
        // Try Schema.org structured data
        const schemaGtin = this.extractFromSchema();
        if (schemaGtin) return schemaGtin;

        // Try data attributes
        const dataGtin = this.extractFromDataAttributes();
        if (dataGtin) return dataGtin;

        // Try meta tags
        const metaGtin = this.extractFromMetaTags();
        if (metaGtin) return metaGtin;

        // Try JSON-LD
        const jsonLdGtin = this.extractFromJsonLd();
        if (jsonLdGtin) return jsonLdGtin;

        return null;
    }

    /**
     * Extract GTIN from Schema.org microdata
     */
    static extractFromSchema() {
        const gtinSelectors = [
            '[itemprop="gtin"]',
            '[itemprop="gtin13"]',
            '[itemprop="gtin12"]',
            '[itemprop="gtin8"]',
            '[itemprop="ean"]'
        ];

        for (const selector of gtinSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const gtin = element.content || element.textContent?.trim();
                if (this.isValidGTIN(gtin)) return gtin;
            }
        }
        return null;
    }

    /**
     * Extract GTIN from data attributes
     */
    static extractFromDataAttributes() {
        const attributes = ['data-gtin', 'data-ean', 'data-upc', 'data-product-code'];

        for (const attr of attributes) {
            const element = document.querySelector(`[${attr}]`);
            if (element) {
                const gtin = element.getAttribute(attr);
                if (this.isValidGTIN(gtin)) return gtin;
            }
        }
        return null;
    }

    /**
     * Extract GTIN from meta tags
     */
    static extractFromMetaTags() {
        const metaNames = ['gtin', 'gtin13', 'product:gtin', 'product:ean'];

        for (const name of metaNames) {
            const meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
            if (meta) {
                const gtin = meta.content;
                if (this.isValidGTIN(gtin)) return gtin;
            }
        }
        return null;
    }

    /**
     * Extract GTIN from JSON-LD structured data
     */
    static extractFromJsonLd() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const gtin = data.gtin || data.gtin13 || data.gtin12 || data.gtin8 || data.ean;
                if (this.isValidGTIN(gtin)) return gtin;

                // Check nested product
                if (data['@type'] === 'Product' || data.product) {
                    const product = data.product || data;
                    const nestedGtin = product.gtin || product.gtin13 || product.ean;
                    if (this.isValidGTIN(nestedGtin)) return nestedGtin;
                }
            } catch (e) {
                // Invalid JSON, skip
            }
        }
        return null;
    }

    /**
     * Validate GTIN format
     */
    static isValidGTIN(gtin) {
        if (!gtin) return false;
        const cleaned = String(gtin).replace(/\D/g, '');
        return cleaned.length >= 8 && cleaned.length <= 14;
    }

    /**
     * Detect product name
     */
    static async detectProductName() {
        // H1 tag
        const h1 = document.querySelector('h1')?.textContent?.trim();
        if (h1 && h1.length > 3 && h1.length < 200) return h1;

        // OG title
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        if (ogTitle && ogTitle.length > 3) return ogTitle;

        // Schema.org name
        const schemaName = document.querySelector('[itemprop="name"]')?.textContent?.trim();
        if (schemaName && schemaName.length > 3) return schemaName;

        return null;
    }

    /**
     * Detect SKU
     */
    static async detectSKU() {
        // Data attributes
        const skuEl = document.querySelector('[data-sku], [data-product-sku]');
        if (skuEl) {
            const sku = skuEl.dataset.sku || skuEl.dataset.productSku || skuEl.textContent?.trim();
            if (sku && sku.length > 0) return sku;
        }

        // Schema.org SKU
        const schemaSku = document.querySelector('[itemprop="sku"]');
        if (schemaSku) {
            const sku = schemaSku.content || schemaSku.textContent?.trim();
            if (sku) return sku;
        }

        return null;
    }

    /**
     * Detect product ID from URL
     */
    static async detectProductId() {
        const url = window.location.pathname;

        // Common patterns: /product/123, /p/123, /item/123
        const patterns = [
            /\/product\/([a-zA-Z0-9-_]+)/,
            /\/p\/([a-zA-Z0-9-_]+)/,
            /\/item\/([a-zA-Z0-9-_]+)/,
            /\/([0-9]{4,})/  // Just numbers
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }
}

export default ProductDetector;
