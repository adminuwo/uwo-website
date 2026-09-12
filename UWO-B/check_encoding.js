const fs = require('fs');
const path = 'c:/Users/USER/Desktop/uwo/UWO-F/admin.html';
const buffer = fs.readFileSync(path);
console.log("FIRST 50 BYTES:", buffer.slice(0, 50));
console.log("HEX:", buffer.slice(0, 50).toString('hex'));
console.log("UTF-16LE STRING:", buffer.slice(0, 50).toString('utf16le'));
console.log("UTF-8 STRING:", buffer.slice(0, 50).toString('utf8'));
