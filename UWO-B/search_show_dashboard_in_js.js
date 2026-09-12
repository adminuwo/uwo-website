const fs = require('fs');
const js = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.js', 'utf8');

const occurrences = [];
let idx = js.toLowerCase().indexOf('showdashboard');
while (idx !== -1) {
  occurrences.push(idx);
  idx = js.toLowerCase().indexOf('showdashboard', idx + 1);
}
console.log("Occurrences of 'showDashboard' in admin.js:", occurrences.length);
occurrences.forEach((o, i) => {
  console.log(`Snippet ${i+1}:`, js.slice(o - 50, o + 150));
});
