const fs = require('fs');
const html = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.html', 'utf8');
const lines = html.split('\n');
for (let i = 350; i < 380; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
