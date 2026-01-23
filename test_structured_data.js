const scraperService = require('./backend/src/services/scraperService');
const logger = require('./backend/src/utils/logger');
const fs = require('fs');
const path = require('path');

// Mock Logger
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

async function testStructuredData() {
    console.log('--- Testing Scraper with Structured Data ---');

    // Read example.html
    const htmlPath = path.join(__dirname, 'example.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Simulate scraping locally
    const context = scraperService.extractContext(html, 'http://localhost/example.html');

    console.log('\nExtracted Context:');
    console.log(JSON.stringify(context, null, 2));

    if (context && context.sku === '120000G' && context.productId === '0198') {
        console.log('\n✅ SUCCESS: Correctly extracted structured data from example.html!');
        console.log(`   - SKU: ${context.sku}`);
        console.log(`   - Product ID: ${context.productId}`);
        console.log(`   - Name: ${context.name}`);
    } else {
        console.log('\n❌ FAILURE: Failed to extract structured data.');
        process.exit(1);
    }
}

testStructuredData();
