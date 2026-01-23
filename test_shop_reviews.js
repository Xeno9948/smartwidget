const KiyohAPI = require('./backend/src/services/kiyohAPI');
const logger = require('./backend/src/utils/logger');

// Mock logger to see output in console
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;

const locationId = '1080586';
const token = 'e4fb6de9-2b55-4df0-8c15-3d2fdd5c6a8b';

async function testShopReviews() {
    console.log('--- Testing Kiyoh Shop Reviews ---');
    const api = new KiyohAPI(); // Uses default base URL

    try {
        const result = await api.getCompanyReviews(locationId, token);
        console.log('\nResult Recieved:');
        console.log('Review Count:', result.reviewCount);
        console.log('Average Rating:', result.averageRating);
        console.log('Reviews Fetched:', result.reviews.length);

        if (result.reviews.length > 0) {
            console.log('\nFirst Review Sample:');
            console.log(result.reviews[0]);
        }

        if (result.reviewCount > 0) {
            console.log('\n✅ SUCCESS: Successfully fetched shop reviews.');
        } else {
            console.log('\n⚠️ WARNING: API returned 0 reviews (could be valid or auth issue).');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }
}

testShopReviews();
