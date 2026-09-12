const fs = require('fs');
const js = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.js', 'utf8');

const target = "function startLegalAutoSave";
const idx = js.indexOf(target);
if (idx !== -1) {
  console.log("=== startLegalAutoSave Block ===");
  console.log(js.slice(idx, idx + 1000));
} else {
  console.log("Not found target");
}
