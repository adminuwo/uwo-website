const fs = require('fs');
const html = fs.readFileSync('c:/Users/USER/Desktop/uwo/UWO-F/admin.html', 'utf8');

let pos = 0;
let commentCount = 0;
while (true) {
  const start = html.indexOf('<!--', pos);
  if (start === -1) break;
  const end = html.indexOf('-->', start);
  if (end === -1) {
    console.log("❌ FOUND UNCLOSED COMMENT starting at character position:", start);
    console.log("Snippet of unclosed comment:", html.slice(start, start + 200));
    break;
  }
  commentCount++;
  pos = end + 3;
}
console.log("Checked", commentCount, "closed comments.");
