/**
 * Simplified Product Information Scraper
 * Extracts product data from the page for the widget context
 */

const ProductInfoScraper = {
    /**
     * Scrape product information from the current page
     * @returns {Object} Scraped product data
     */
    scrape() {
        const jsonLd = this.getJsonLd();

        return {
            // Core identifiers from JSON-LD (CRITICAL for reviews)
            sku: jsonLd?.sku || null,
            productId: jsonLd?.productID || jsonLd?.identifier || null,
            gtin: jsonLd?.gtin13 || jsonLd?.gtin || jsonLd?.gtin12 || jsonLd?.gtin8 || null,
            mpn: jsonLd?.mpn || null,

            // Product details
            name: jsonLd?.name || this.getMetaContent('og:title') || document.title,
            description: jsonLd?.description || this.getMetaContent('og:description') || this.getMetaContent('description'),
            url: window.location.href,
            price: this.getProductPrice(),
            currency: this.getCurrency(),
            image: jsonLd?.image || this.getMetaContent('og:image'),
            specs: this.extractBasicSpecs()
        };
    },

    getMetaContent(name) {
        const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return element ? element.getAttribute('content') : '';
    },

    getProductPrice() {
        // Try structured data first
        const jsonLd = this.getJsonLd();
        if (jsonLd && (jsonLd.offers?.price || jsonLd.price)) {
            return jsonLd.offers?.price || jsonLd.price;
        }

        // Fallback to common selectors
        const selectors = [
            '[itemprop="price"]',
            '.price',
            '.product-price',
            '#price'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el.textContent.trim();
        }
        return '';
    },

    getCurrency() {
        const jsonLd = this.getJsonLd();
        if (jsonLd && (jsonLd.offers?.priceCurrency || jsonLd.priceCurrency)) {
            return jsonLd.offers?.priceCurrency || jsonLd.priceCurrency;
        }
        return 'EUR';
    },

    getJsonLd() {
        try {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'Product') return data;
            }
        } catch (e) {
            return null;
        }
        return null;
    },

    extractBasicSpecs() {
        const specs = {};

        // 1. Try table data
        const rows = document.querySelectorAll('table tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            if (cells.length === 2) {
                const key = cells[0].textContent.trim().replace(/:$/, '');
                const val = cells[1].textContent.trim();
                if (key && val && key.length < 50 && val.length < 200) {
                    specs[key] = val;
                }
            }
        });

        // 2. Try definition lists
        const dls = document.querySelectorAll('dl');
        dls.forEach(dl => {
            const dts = dl.querySelectorAll('dt');
            const dds = dl.querySelectorAll('dd');
            if (dts.length === dds.length) {
                dts.forEach((dt, i) => {
                    const key = dt.textContent.trim().replace(/:$/, '');
                    const val = dds[i].textContent.trim();
                    if (key && val) specs[key] = val;
                });
            }
        });

        return specs;
    }
};

export default ProductInfoScraper;
