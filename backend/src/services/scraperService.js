const logger = require('../utils/logger');

/**
 * Service to scrape product context from a URL
 * Enhanced to extract JSON-LD structured data
 */
class ScraperService {
    constructor() { }

    /**
     * Scrape URL for title, description, and metadata
     * @param {string} url - The URL to scrape
     * @returns {Promise<Object>} extracted context
     */
    async scrape(url) {
        if (!url) return null;

        try {
            logger.info(`🔍 Scraper generating context for: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'KiyohAIWidget-Bot/1.0 (+http://kiyoh.com)'
                }
            });

            if (!response.ok) {
                logger.warn(`Scraper failed: HTTP ${response.status}`);
                return null;
            }

            const html = await response.text();
            return this.extractContext(html, url);

        } catch (error) {
            logger.error(`Scraper error: ${error.message}`);
            return null;
        }
    }

    extractContext(html, url) {
        const context = {
            source: 'backend-scraper',
            url: url,
            name: null,
            description: null,
            specs: {},
            productId: null,
            sku: null,
            gtin: null
        };

        // 1. PRIORITY: Extract JSON-LD Structured Data (most reliable)
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        if (jsonLdMatches) {
            for (const match of jsonLdMatches) {
                const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
                try {
                    const data = JSON.parse(jsonContent);

                    // Handle Product schema
                    if (data['@type'] === 'Product' || (Array.isArray(data['@graph']) && data['@graph'].find(i => i['@type'] === 'Product'))) {
                        const product = data['@type'] === 'Product' ? data : data['@graph'].find(i => i['@type'] === 'Product');

                        if (product.name) context.name = product.name;
                        if (product.description) context.description = product.description;
                        if (product.sku) context.sku = product.sku;
                        if (product.productID) context.productId = product.productID;
                        if (product.gtin13) context.gtin = product.gtin13;
                        if (product.gtin) context.gtin = product.gtin;
                        if (product.gtin8) context.gtin = product.gtin8;
                        if (product.gtin12) context.gtin = product.gtin12;
                        if (product.mpn) context.productId = context.productId || product.mpn;

                        logger.info(`✅ Extracted structured data: SKU=${context.sku}, ProductID=${context.productId}, GTIN=${context.gtin}`);
                    }
                } catch (e) {
                    logger.warn(`Failed to parse JSON-LD: ${e.message}`);
                }
            }
        }

        // 2. Fallback: Extract Title
        if (!context.name) {
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) context.name = titleMatch[1].trim();
        }

        // 3. Fallback: Extract Meta Description
        if (!context.description) {
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
            if (descMatch) context.description = handleEntities(descMatch[1].trim());
        }

        // 4. Fallback: Extract OG Description
        if (!context.description) {
            const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (ogDesc) context.description = handleEntities(ogDesc[1].trim());
        }

        // 5. Fallback: Extract OG Title
        if (!context.name) {
            const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (ogTitle) context.name = handleEntities(ogTitle[1].trim());
        }

        // 6. Extract OG Image
        const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (ogImage) context.image = ogImage[1].trim();

        logger.info(`Scraping summary: Name="${context.name?.substring(0, 40)}...", IDs=[SKU:${context.sku}, PID:${context.productId}, GTIN:${context.gtin}]`);

        // Only return if we found something useful
        if (context.name || context.description || context.sku || context.productId || context.gtin) {
            return {
                name: context.name,
                description: context.description,
                specs: {}, // Empty but defined schema
                productId: context.productId,
                sku: context.sku,
                gtin: context.gtin
            };
        }

        return null;
    }
}

// Simple HTML entity decoder for common chars
function handleEntities(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

module.exports = new ScraperService();
