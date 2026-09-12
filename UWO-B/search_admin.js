const fs = require('fs');
const html = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.html', 'utf8');

const lines = html.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('login')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
