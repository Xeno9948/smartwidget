const https = require('https');

const locationId = '1080586';
// User confirmed this is the ONLY key
const token = 'e4fb6de9-2b55-4df0-8c15-3d2fdd5c6a8b';

const domain = 'www.klantenvertellen.nl';
// Using LIST endpoint to avoid "Product Not Found" server crash (500)
const path = `/v1/location/product/external?locationId=${locationId}`;

const options = {
    hostname: domain,
    path: path,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Publication-Api-Token': token
    }
};

console.log(`🔎 Testing LIST PRODUCTS on ${domain}...`);
console.log(`URL: https://${domain}${path}`);

const req = https.request(options, (res) => {
    console.log(`\nStatus: ${res.statusCode} ${res.statusMessage}`);
    console.log('Headers:', res.headers);

    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
        console.log('\nBody:', body.substring(0, 500));

        if (res.statusCode === 200) {
            console.log('\n✅ SUCCESS! Token is valid via Header Auth.');
        } else if (res.statusCode === 500) {
            console.log('\n⚠️ 500 Error: Server crashed, but Auth passed (otherwise 401).');
        } else if (res.statusCode === 401) {
            console.log('\n❌ 401 Unauthorized: Token rejected.');
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.end();
