const http = require('http');
const data = JSON.stringify({
  "affiliateCode": "UWO-ABHAA-001",
  "productSlug": "efv",
  "visitorId": "fp_gemini_test",
  "referrer": "",
  "landingPage": "http://localhost:5173/efv.html",
  "browser": "Gemini Browser",
  "device": "Desktop"
});
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/affiliate/track/click',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = http.request(options, (res) => {
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => console.log('Response:', resData));
});
req.on('error', console.error);
req.write(data);
req.end();
