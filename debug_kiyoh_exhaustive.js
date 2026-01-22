const https = require('https');

const locationId = '1080586';
const token = 'e4fb6de9-2b55-4df0-8c15-3d2fdd5c6a8b';
const productCode = '123'; // Dummy code

const domain = 'www.klantenvertellen.nl';
const pathBase = `/v1/publication/product/review/external?locationId=${locationId}&productCode=${productCode}`;

const tests = [
    {
        name: 'Auth via Header (X-Publication-Api-Token)',
        headers: { 'X-Publication-Api-Token': token },
        path: pathBase
    },
    {
        name: 'Auth via Query Param (?hash=)',
        headers: {},
        path: `${pathBase}&hash=${token}`
    },
    {
        name: 'Auth via Query Param (?token=)',
        headers: {},
        path: `${pathBase}&token=${token}`
    },
    {
        name: 'Auth via Header (Authorization: Bearer)',
        headers: { 'Authorization': `Bearer ${token}` },
        path: pathBase
    }
];

console.log(`🔎 Starting Exhaustive Auth Test on ${domain}...\n`);

function runNextTest(index) {
    if (index >= tests.length) {
        console.log('\n🏁 All tests completed.');
        return;
    }

    const test = tests[index];
    console.log(`[TEST ${index + 1}] ${test.name}`);
    console.log(`URL: https://${domain}${test.path}`);

    const options = {
        hostname: domain,
        path: test.path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...test.headers
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
            if (res.statusCode === 200) {
                console.log('🎉 SUCCESS!!! This is the working method!');
                console.log('Body snippet:', body.substring(0, 100));
            } else {
                console.log('Result: Failed (Not 200)');
            }
            console.log('---');
            runNextTest(index + 1);
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e.message);
        runNextTest(index + 1);
    });

    req.end();
}

runNextTest(0);
