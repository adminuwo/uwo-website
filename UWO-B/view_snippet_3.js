const fs = require('fs');
const js = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.js', 'utf8');

const target = "document.addEventListener('DOMContentLoaded'";
const idx = js.indexOf(target);
if (idx !== -1) {
  console.log("=== DOMContentLoaded Block ===");
  console.log(js.slice(idx, idx + 2500));
}
