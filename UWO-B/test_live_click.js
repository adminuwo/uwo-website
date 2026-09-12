// Simulate what the frontend does when affiliate link is clicked
// POST /api/affiliate/track/click with the tracking payload

const http = require('http');

const payload = JSON.stringify({
    affiliateCode: 'UWO-ABHAA-001',
    productSlug: 'efv',
    visitorId: 'test_verify_' + Date.now(),   // NEW unique visitor each time
    referrer: 'https://google.com',
    landingPage: 'https://efvframework.com/?affiliate=UWO-ABHAA-001',
    browser: 'Google Chrome',
    device: 'Desktop'
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/affiliate/track/click',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const parsed = JSON.parse(data);
            console.log('Response:', JSON.stringify(parsed, null, 2));
            
            if (res.statusCode === 201) {
                console.log('\n✅ CLICK TRACKED SUCCESSFULLY!');
                console.log('ViewId:', parsed.viewId);
                console.log('VisitorId:', parsed.visitorId);
                console.log('IsDuplicate:', parsed.isDuplicate);
                
                if (parsed.isDuplicate) {
                    console.log('\n⚠️  This was a DUPLICATE click (30-min dedup window). Views wont increase for same visitor within 30 mins.');
                } else {
                    console.log('\n✅ New unique view recorded. Dashboard count should increase by 1.');
                }
            } else {
                console.log('\n❌ TRACKING FAILED!');
            }
        } catch(e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Connection error (is server running on :8080?):', e.message);
});

req.write(payload);
req.end();
