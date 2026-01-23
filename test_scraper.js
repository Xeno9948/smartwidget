const scraperService = require('./backend/src/services/scraperService');
const logger = require('./backend/src/utils/logger');

// Mock Logger
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

async function testScraper() {
    console.log('--- Testing Scraper Service ---');
    const url = 'http://example.com'; // Stable test URL

    try {
        const context = await scraperService.scrape(url);

        console.log('\nScrape Result:');
        console.log(JSON.stringify(context, null, 2));

        if (context && context.name && context.name.includes('Example Domain')) {
            console.log('\n✅ SUCCESS: Correctly scraped Example Domain.');
        } else {
            console.log('\n❌ FAILURE: scraping failed or incorrect content.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error);
        process.exit(1);
    }
}

testScraper();
