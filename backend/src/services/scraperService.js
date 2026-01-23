const logger = require('../utils/logger');

/**
 * Service to scrape basic product context from a URL
 * (Fallback when frontend scraping fails)
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
            title: null,
            description: null,
            specs: {} // Cannot verify specs reliably with regex, but title/desc is usually enough
        };

        // Extract Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) context.title = titleMatch[1].trim();

        // Extract Meta Description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
        if (descMatch) context.description = handleEntities(descMatch[1].trim());

        // Extract OG Description (fallback)
        if (!context.description) {
            const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (ogDesc) context.description = handleEntities(ogDesc[1].trim());
        }

        // Extract OG Title (fallback)
        if (!context.title) {
            const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (ogTitle) context.title = handleEntities(ogTitle[1].trim());
        }

        // Extract OG Image
        const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (ogImage) context.image = ogImage[1].trim();

        logger.info(`Scraping result: Title="${context.title?.substring(0, 30)}...", Desc="${context.description?.substring(0, 30)}..."`);

        // Only return if we found something useful
        if (context.title || context.description) {
            return {
                name: context.title,
                description: context.description,
                specs: {} // Empty but defined schema
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
