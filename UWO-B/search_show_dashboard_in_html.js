const fs = require('fs');
const html = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.html', 'utf8');

const occurrences = [];
let idx = html.toLowerCase().indexOf('showdashboard');
while (idx !== -1) {
  occurrences.push(idx);
  idx = html.toLowerCase().indexOf('showdashboard', idx + 1);
}
console.log("Occurrences of 'showDashboard' in admin.html:", occurrences.length);
occurrences.forEach((o, i) => {
  console.log(`Snippet ${i+1}:`, html.slice(o - 50, o + 150));
});
