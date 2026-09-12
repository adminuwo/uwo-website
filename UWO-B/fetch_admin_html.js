const http = require('http');

http.get('http://localhost:5173/admin.html', (res) => {
  console.log("Response Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Response Data Length:", data.length);
    console.log("First 300 characters of Response:\n", data.slice(0, 300));
  });
}).on('error', (err) => {
  console.error("HTTP Request Error:", err.message);
});
