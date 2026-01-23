const path = require('path');

// 1. Setup Environment
process.env.GEMINI_API_KEY = 'dummy_key_for_test';
process.env.KIYOH_BASE_URL = 'https://example.com';

// 2. Mock Services via Prototypes
const GeminiService = require('./backend/src/services/geminiService');
const KiyohAPI = require('./backend/src/services/kiyohAPI');
const CacheService = require('./backend/src/services/cacheService');
const customerService = require('./backend/src/services/customerService');
const QAPair = require('./backend/src/models/QAPair');
const Analytics = require('./backend/src/models/Analytics');

// Mock Gemini
GeminiService.prototype.generateAnswer = async function () {
    console.log('⚡️ [Mock] GeminiService.generateAnswer called');
    return { answer: 'Mock Answer', confidence: 'high', tokensUsed: 10 };
};

// Mock Kiyoh
KiyohAPI.prototype.getProductReviews = async function () {
    console.log('⚡️ [Mock] KiyohAPI.getProductReviews called');
    return {
        reviews: [],
        reviewCount: 10,
        averageRating: 8.5,
        productName: 'Mock Product'
    };
};

KiyohAPI.prototype.getCompanyReviews = async function () {
    console.log('⚡️ [Mock] KiyohAPI.getCompanyReviews called (SUCCESS!)');
    return {
        reviews: [],
        reviewCount: 500,
        averageRating: 9.2, // Shop Rating
        recommendationPercentage: 98
    };
};

// Mock Cache & DB (to prevent connection errors)
CacheService.prototype.getQA = async () => null;
CacheService.prototype.cacheQA = async () => { };
CacheService.prototype.incrementQuestionCount = async () => { };

// Mock Customer Service (crucial for auth check)
customerService.getCustomerByLocationId = async (id) => {
    console.log(`⚡️ [Mock] Customer found for ${id}`);
    return { id: 1, company_name: 'Test Shop', api_token: 'valid_token' };
};

// Mock Models
QAPair.create = async () => { };
Analytics.log = async () => { };

// 3. Import Controller (after mocks are set)
const qaController = require('./backend/src/controllers/qaController');
const logger = require('./backend/src/utils/logger');

// Mock Logger
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;

// 4. Test Execution
const res = {
    json: (data) => {
        console.log('\n✅ Response Received:', JSON.stringify(data, null, 2));

        if (data.data.shop && data.data.shop.rating === 9.2) {
            console.log('\n🎉 SUCCESS: Shop rating correctly integrated!');
        } else {
            console.error('\n❌ FAILURE: Shop rating missing or incorrect.');
            process.exit(1);
        }
    },
    status: (code) => ({
        json: (data) => {
            console.log(`\nResponse [${code}]:`, data);
            if (code !== 200) process.exit(1);
        }
    })
};

const req = {
    body: {
        locationId: '1080586',
        question: 'Hoe is de service?',
        productCode: '123',
        language: 'nl'
    },
    ip: '127.0.0.1',
    get: () => 'TestAgent' // user-agent
};

const next = (err) => {
    console.error('\n❌ Error in Controller:', err);
    process.exit(1);
};

console.log('--- Verifying Full Q&A Flow (Mocked) ---');
qaController.handleQuestion(req, res, next);
