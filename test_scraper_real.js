const scraperService = require('./backend/src/services/scraperService');
const logger = require('./backend/src/utils/logger');

// Mock Logger
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

async function testRealScraper() {
    console.log('--- Testing Scraper Service on Real URL ---');
    // Use a stable URL with known metadata
    const url = 'https://github.com';

    try {
        const context = await scraperService.scrape(url);

        console.log('\nScrape Result:');
        console.log(JSON.stringify(context, null, 2));

        if (context && (context.title || context.description)) {
            console.log('\n✅ SUCCESS: Scraper fetched content.');
        } else {
            console.log('\n❌ FAILURE: Scraper returned null or empty.');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }
}

testRealScraper();
