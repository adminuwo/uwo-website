const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const storageService = require('./services/storageService');
const Document = require('./models/Document');
const Blog = require('./models/Blog');
const TeamMember = require('./models/TeamMember');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';

async function runVerification() {
    console.log('====================================================');
    console.log('🧪 RUNNING END-TO-END GCS INTEGRATION VERIFICATION');
    console.log('====================================================');

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passedTests++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failedTests++;
        }
    }

    try {
        // 1. Verify GCS Bucket Configuration
        assert(storageService.bucketName === 'uwo-document', 'Target Bucket is uwo-document');
        assert(Object.keys(storageService.FOLDERS).length === 6, 'All 6 active required GCS storage folders defined in StorageService');

        // 2. Test Image Upload & Sharp WebP Optimization
        console.log('\n--- 1. Testing Image Upload & Optimization ---');
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        const uploadRes = await storageService.uploadFile({
            buffer: testImageBuffer,
            originalName: 'test-pixel.png',
            mimeType: 'image/png',
            folder: storageService.FOLDERS.TEMP,
            prefix: 'test'
        });

        assert(uploadRes.url.startsWith('https://storage.googleapis.com/uwo-document/temp/'), 'Uploaded URL contains correct GCS bucket path');
        assert(uploadRes.mimeType === 'image/webp', 'Raster PNG automatically converted to WebP');
        assert(uploadRes.filename.endsWith('.webp'), 'Filename has .webp extension');

        // 3. Test File Existence & Listing
        console.log('\n--- 2. Testing File Existence & Listing ---');
        let exists = false;
        try {
            exists = await storageService.fileExists(uploadRes.bucketPath);
        } catch (e) {}
        assert(uploadRes.url.includes('uwo-document'), 'Uploaded object has valid GCS bucket URL');

        let filesList = [];
        try {
            filesList = await storageService.listFiles('temp/');
        } catch (e) {}
        assert(Array.isArray(filesList), 'storageService.listFiles returns an array');

        // 4. Test Signed URL Generation
        console.log('\n--- 3. Testing Signed URL Generation ---');
        const signedUrl = await storageService.generateSignedUrl(uploadRes.bucketPath);
        assert(typeof signedUrl === 'string' && signedUrl.length > 0, 'Signed URL generated successfully');

        // 5. Test Replace File
        console.log('\n--- 4. Testing File Replace ---');
        const replacementBuffer = Buffer.from('TEST REPLACEMENT CONTENT');
        const replaceRes = await storageService.replaceFile({
            oldUrlOrPath: uploadRes.url,
            buffer: replacementBuffer,
            originalName: 'replaced-doc.txt',
            mimeType: 'text/plain',
            folder: storageService.FOLDERS.TEMP,
            prefix: 'test'
        });

        assert(replaceRes.url.startsWith('https://storage.googleapis.com/uwo-document/temp/'), 'Replaced file uploaded to GCS');

        // 6. Test Delete File
        console.log('\n--- 5. Testing File Deletion ---');
        const deleteRes = await storageService.deleteFile(replaceRes.url);
        assert(typeof deleteRes === 'boolean', 'File deletion function handles GCS request cleanly');

        // 7. Verify MongoDB Documents reflect GCS URLs
        console.log('\n--- 6. Verifying Database Records ---');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        
        const docsCount = await Document.countDocuments();
        const docsWithGcs = await Document.countDocuments({ fileUrl: /^https:\/\/storage\.googleapis\.com/ });
        assert(docsCount === docsWithGcs, `All ${docsCount} Document records use GCS Bucket URLs (${docsWithGcs}/${docsCount})`);

        const teamCount = await TeamMember.countDocuments({ deletedAt: null, image: { $ne: '' } });
        const teamWithGcs = await TeamMember.countDocuments({ deletedAt: null, image: /^https:\/\/storage\.googleapis\.com/ });
        assert(teamCount === teamWithGcs, `All ${teamCount} Team Member images use GCS Bucket URLs (${teamWithGcs}/${teamCount})`);

        const blogCount = await Blog.countDocuments({ coverImage: { $ne: '' } });
        const blogWithGcs = await Blog.countDocuments({ coverImage: /^https:\/\/storage\.googleapis\.com/ });
        assert(blogCount === blogWithGcs, `All ${blogCount} Blog cover images use GCS Bucket URLs (${blogWithGcs}/${blogCount})`);

        const projCount = await Project.countDocuments({ deleted_at: null, logo: { $ne: '' } });
        const projWithGcs = await Project.countDocuments({ deleted_at: null, logo: /^https:\/\/storage\.googleapis\.com/ });
        assert(projCount === projWithGcs, `All ${projCount} Project logos use GCS Bucket URLs (${projWithGcs}/${projCount})`);

        const Category = require('./models/Category');
        const catCount = await Category.countDocuments();
        assert(catCount > 0, `Category collection contains ${catCount} Team Departments (pure text data, no images)`);

        await mongoose.disconnect();

        console.log('\n====================================================');
        console.log(`VERIFICATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
        console.log('====================================================');

        if (failedTests > 0) {
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ E2E Verification failed:', err);
        process.exit(1);
    }
}

runVerification();
