/**
 * Product Information Scraper
 * Extracts comprehensive product information from hosting page
 * AGGRESSIVE MODE - scans entire page
 */

class ProductInfoScraper {
    constructor() {
        this.productInfo = {
            name: null,
            specs: {},
            description: null,
            attributes: {},
            images: []
        };
    }

    /**
     * Scrape all product information from page
     */
    scrape() {
        console.log('[ProductInfoScraper] Starting product info extraction...');

        this.extractProductName();
        this.extractDescription();
        this.extractSpecifications();
        this.extractAttributes();
        this.extractImages();

        console.log('[ProductInfoScraper] Extracted:', this.productInfo);
        return this.productInfo;
    }

    /**
     * Extract product name from various sources
     */
    extractProductName() {
        // Try multiple strategies
        const strategies = [
            // H1 tag (most common)
            () => document.querySelector('h1')?.textContent?.trim(),

            // Open Graph title
            () => document.querySelector('meta[property="og:title"]')?.content,

            // Product name meta
            () => document.querySelector('meta[name="product_name"]')?.content,

            // Schema.org Product
            () => {
                const schema = document.querySelector('[itemtype*="schema.org/Product"]');
                return schema?.querySelector('[itemprop="name"]')?.textContent?.trim();
            },

            // Title tag (fallback)
            () => document.title.split('|')[0].split('-')[0].trim()
        ];

        for (const strategy of strategies) {
            try {
                const name = strategy();
                if (name && name.length > 0 && name.length < 200) {
                    this.productInfo.name = name;
                    console.log('[ProductInfoScraper] Found product name:', name);
                    return;
                }
            } catch (e) {
                // Try next strategy
            }
        }
    }

    /**
     * Extract product description
     */
    extractDescription() {
        const strategies = [
            // Meta description
            () => document.querySelector('meta[name="description"]')?.content,

            // Open Graph description
            () => document.querySelector('meta[property="og:description"]')?.content,

            // Common description selectors
            () => document.querySelector('.product-description')?.textContent?.trim(),
            () => document.querySelector('#description')?.textContent?.trim(),
            () => document.querySelector('[class*="description"]')?.textContent?.trim(),

            // Schema.org description
            () => document.querySelector('[itemprop="description"]')?.textContent?.trim()
        ];

        for (const strategy of strategies) {
            try {
                const desc = strategy();
                if (desc && desc.length > 10 && desc.length < 1000) {
                    this.productInfo.description = desc;
                    console.log('[ProductInfoScraper] Found description');
                    return;
                }
            } catch (e) {
                // Try next
            }
        }
    }

    /**
     * Extract technical specifications - AGGRESSIVE MODE
     * Scans ALL tables, lists, and divs on page
     */
    extractSpecifications() {
        const specs = {};

        // Strategy 1: Extract from ANY table on the page
        const allTables = document.querySelectorAll('table');
        allTables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                if (cells.length >= 2) {
                    const key = cells[0].textContent.trim();
                    const value = cells[1].textContent.trim();
                    // Only add if key looks like a spec name
                    if (key && value && key.length < 50 && value.length < 200) {
                        specs[this.normalizeKey(key)] = value;
                    }
                }
            });
        });

        // Strategy 2: Extract from ANY definition list
        const allDls = document.querySelectorAll('dl');
        allDls.forEach(dl => {
            const dts = dl.querySelectorAll('dt');
            const dds = dl.querySelectorAll('dd');
            dts.forEach((dt, i) => {
                if (dds[i]) {
                    const key = dt.textContent.trim();
                    const value = dds[i].textContent.trim();
                    if (key && value && key.length < 50) {
                        specs[this.normalizeKey(key)] = value;
                    }
                }
            });
        });

        // Strategy 3: Find divs with key-value patterns
        // Look for: <div>LABEL</div><div>VALUE</div>
        const allDivs = document.querySelectorAll('div');
        for (let i = 0; i < allDivs.length - 1; i++) {
            const div1 = allDivs[i];
            const div2 = allDivs[i + 1];

            // Skip if they have children
            if (div1.children.length === 0 && div2.children.length === 0) {
                const text1 = div1.textContent.trim();
                const text2 = div2.textContent.trim();

                // Labels often ALL CAPS or short
                if (text1.length > 2 && text1.length < 50 &&
                    text2.length > 0 && text2.length < 200 &&
                    text1.toUpperCase() === text1) {
                    specs[this.normalizeKey(text1)] = text2;
                }
            }
        }

        // Strategy 4: Data attributes
        const specElements = document.querySelectorAll('[data-spec], [itemprop]');
        specElements.forEach(el => {
            const key = el.dataset.spec || el.getAttribute('itemprop');
            const value = el.textContent?.trim() || el.content;
            if (key && value && key.length < 50) {
                specs[this.normalizeKey(key)] = value;
            }
        });

        if (Object.keys(specs).length > 0) {
            this.productInfo.specs = specs;
            console.log('[ProductInfoScraper] Found', Object.keys(specs).length, 'specifications:', specs);
        } else {
            console.warn('[ProductInfoScraper] No specifications found on page');
        }
    }

    /**
     * Extract product attributes (color, size, etc.)
     */
    extractAttributes() {
        const attrs = {};

        // Color
        const colorEl = document.querySelector('[data-color], .color-name, [itemprop="color"]');
        if (colorEl) {
            attrs.color = colorEl.textContent?.trim() || colorEl.dataset.color;
        }

        // Size
        const sizeEl = document.querySelector('[data-size], .size-value, [itemprop="size"]');
        if (sizeEl) {
            attrs.size = sizeEl.textContent?.trim() || sizeEl.dataset.size;
        }

        // Material
        const materialEl = document.querySelector('[data-material], [itemprop="material"]');
        if (materialEl) {
            attrs.material = materialEl.textContent?.trim() || materialEl.dataset.material;
        }

        // Brand
        const brandEl = document.querySelector('[itemprop="brand"]');
        if (brandEl) {
            attrs.brand = brandEl.textContent?.trim() || brandEl.content;
        }

        if (Object.keys(attrs).length > 0) {
            this.productInfo.attributes = attrs;
            console.log('[ProductInfoScraper] Found attributes:', attrs);
        }
    }

    /**
     * Extract product images
     */
    extractImages() {
        const images = [];

        // Open Graph image
        const ogImage = document.querySelector('meta[property="og:image"]')?.content;
        if (ogImage) images.push(ogImage);

        // Product images
        const imgElements = document.querySelectorAll('.product-image img, [class*="product-img"] img, [itemprop="image"]');
        imgElements.forEach(img => {
            const src = img.src || img.dataset.src;
            if (src && !images.includes(src)) {
                images.push(src);
            }
        });

        this.productInfo.images = images.slice(0, 3); // Limit to first 3
    }

    /**
     * Normalize spec key for consistency
     */
    normalizeKey(key) {
        return key.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_');
    }
}

export default ProductInfoScraper;
