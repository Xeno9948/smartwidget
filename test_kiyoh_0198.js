/**
 * Test Kiyoh API with product code 0198
 */

const locationId = '1080586';
const apiToken = 'e4fb6de9-2b55-4df0-8c15-3d2fdd5c6a8b';
const productCode = '0198';

const baseUrl = 'https://www.kiyoh.com';
const url = `${baseUrl}/v1/publication/product/review/external?locationId=${locationId}&productCode=${encodeURIComponent(productCode)}`;

console.log('--- Testing Kiyoh API ---');
console.log(`URL: ${url}`);
console.log(`Product Code: ${productCode}`);
console.log('');

async function testKiyohAPI() {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Publication-Api-Token': apiToken
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log('\nResponse Body:');

        try {
            const json = JSON.parse(text);
            console.log(JSON.stringify(json, null, 2));

            if (json.reviews && json.reviews.length > 0) {
                console.log(`\n✅ SUCCESS: Found ${json.reviews.length} product reviews!`);
            } else if (json.numberReviews === 0) {
                console.log('\n⚠️ No reviews found for this product code.');
            }
        } catch (e) {
            console.log(text.substring(0, 500));
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

testKiyohAPI();
