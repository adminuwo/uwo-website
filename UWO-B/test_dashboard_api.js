// Dump the full dashboard API response to see what fields are returned
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const SalesPartner = require('./models/SalesPartner');
    const partner = await SalesPartner.findOne({ affiliateCode: 'UWO-ABHAA-001' });
    await mongoose.disconnect();

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ partnerId: partner._id, email: partner.email }, process.env.JWT_SECRET || 'uwo_secret_123456789', { expiresIn: '1h' });

    const dashRes = await makeRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/affiliate/partner/dashboard',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status:', dashRes.status);
    console.log('TOP-LEVEL KEYS:', Object.keys(dashRes.body));
    console.log('\nFULL RESPONSE (no productStats/activities):');
    const { productStats, activities, ...rest } = dashRes.body;
    console.log(JSON.stringify(rest, null, 2));
    console.log('\nproductStats[0] keys:', productStats && productStats[0] ? Object.keys(productStats[0]) : 'none');
    if (productStats && productStats[0]) {
        console.log('productStats[0]:', JSON.stringify(productStats[0], null, 2));
    }
}

main().catch(err => console.error('Error:', err.message));
