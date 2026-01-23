// Standalone test without requiring backend dependencies
const fs = require('fs');
const path = require('path');

function extractContext(html) {
    const context = {
        name: null,
        sku: null,
        productId: null
    };

    // Extract JSON-LD Structured Data
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
            const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            try {
                const data = JSON.parse(jsonContent);

                if (data['@type'] === 'Product') {
                    if (data.name) context.name = data.name;
                    if (data.sku) context.sku = data.sku;
                    if (data.productID) context.productId = data.productID;

                    console.log('✅ Found Product schema in JSON-LD!');
                }
            } catch (e) {
                console.warn(`Failed to parse JSON-LD: ${e.message}`);
            }
        }
    }

    return context;
}

const htmlPath = path.join(__dirname, 'example.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('--- Testing JSON-LD Extraction ---');
const result = extractContext(html);

console.log('\nExtracted:');
console.log(`  Name: ${result.name}`);
console.log(`  SKU: ${result.sku}`);
console.log(`  Product ID: ${result.productId}`);

if (result.sku === '120000G' && result.productId === '0198') {
    console.log('\n✅ SUCCESS: Correctly extracted structured data!');
} else {
    console.log('\n❌ FAILURE: Extraction incomplete.');
    process.exit(1);
}
