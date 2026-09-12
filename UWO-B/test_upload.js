const fs = require('fs');
const path = require('path');
const storageService = require('./services/storageService');
require('dotenv').config();

async function testUpload() {
  try {
    fs.writeFileSync('test.txt', 'hello world');
    const uploadRes = await storageService.uploadFile({
      filePath: path.resolve('test.txt'),
      originalName: 'test.txt',
      mimeType: 'text/plain',
      folder: storageService.FOLDERS.DOCUMENTS || 'documents',
      prefix: 'pricing',
      options: { uploadedBy: 'admin' }
    });
    console.log('Upload success:', uploadRes);
  } catch (err) {
    console.error('Upload error:', err);
  }
}
testUpload();
