const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', d => resData += d);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resData) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: resData });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTest() {
    try {
        console.log("1. Logging in...");
        const loginData = JSON.stringify({ email: "devansh@uwo24.com", password: "Abha2004@" });
        const loginRes = await request({
            hostname: 'localhost', port: 8080, path: '/api/affiliate/partner/login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
        }, loginData);
        
        if (loginRes.status !== 200) {
            console.error("Login failed:", loginRes.data);
            return;
        }
        
        const token = loginRes.data.token;
        const affiliateCode = loginRes.data.partner.affiliateCode;
        console.log(`Logged in successfully! Code: ${affiliateCode}`);

        console.log("2. Fetching dashboard...");
        const dashRes = await request({
            hostname: 'localhost', port: 8080, path: '/api/affiliate/partner/dashboard', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("Dashboard Stats before click:", dashRes.data.stats);
        
        console.log("3. Triggering a click...");
        const clickData = JSON.stringify({
            affiliateCode: affiliateCode,
            productSlug: 'efv',
            visitorId: 'fp_test_devansh_123',
            landingPage: 'http://localhost:5173/efv.html'
        });
        const clickRes = await request({
            hostname: 'localhost', port: 8080, path: '/api/affiliate/track/click', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': clickData.length }
        }, clickData);
        
        console.log("Click Response:", clickRes.data);
        
        console.log("4. Fetching dashboard again...");
        const dashRes2 = await request({
            hostname: 'localhost', port: 8080, path: '/api/affiliate/partner/dashboard', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("Dashboard Stats after click:", dashRes2.data.stats);
        
    } catch (e) {
        console.error("Error:", e);
    }
}

runTest();
