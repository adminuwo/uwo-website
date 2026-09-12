const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { Storage } = require('@google-cloud/storage');

const BUCKET_NAME = process.env.GCP_BUCKET_NAME || process.env.GCS_BUCKET_NAME || process.env.BUCKET_NAME || 'uwo-document';
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || 'unified-web-options';

const storage = new Storage({ projectId: PROJECT_ID });
const bucket = storage.bucket(BUCKET_NAME);

// Prefixes to completely remove from GCS
const EXTRA_PREFIXES = [
    'banners/',
    'team-images/',
    'categories/images/',
    'categories/',
    'products/images/'
];

// Exact allowed folders to keep / ensure
const EXACT_FOLDERS = [
    'blogs/images/',
    'products/logos/',
    'rag/documents/',
    'team/images/',
    'logos/',
    'temp/'
];

async function cleanupExtraFolders() {
    console.log('====================================================');
    console.log('🧹 CLEANING UP EXTRA GCS BUCKET FOLDERS & OBJECTS');
    console.log('====================================================');
    console.log(`🪣 Bucket: ${BUCKET_NAME}`);

    let totalDeleted = 0;

    for (const prefix of EXTRA_PREFIXES) {
        console.log(`\n🔍 Searching extra objects under: ${prefix}`);
        try {
            const [files] = await bucket.getFiles({ prefix });
            if (files.length === 0) {
                console.log(`  ✓ No objects found under ${prefix}`);
                continue;
            }

            for (const file of files) {
                try {
                    await file.delete({ ignoreNotFound: true });
                    totalDeleted++;
                    console.log(`  🗑️ Deleted extra object: gs://${BUCKET_NAME}/${file.name}`);
                } catch (delErr) {
                    console.warn(`  ⚠️ Could not delete ${file.name}:`, delErr.message);
                }
            }
        } catch (err) {
            console.error(`  ❌ Error querying prefix ${prefix}:`, err.message);
        }
    }

    console.log('\n📁 Ensuring exact 7 folder markers exist...');
    for (const folder of EXACT_FOLDERS) {
        try {
            const placeholder = bucket.file(`${folder}.keep`);
            const [exists] = await placeholder.exists();
            if (!exists) {
                await placeholder.save('', { metadata: { contentType: 'text/plain' } });
                console.log(`  ✅ Created marker for: gs://${BUCKET_NAME}/${folder}`);
            } else {
                console.log(`  ✓ Folder marker already present: gs://${BUCKET_NAME}/${folder}`);
            }
        } catch (err) {
            console.warn(`  ⚠️ Folder marker check info for ${folder}:`, err.message);
        }
    }

    console.log('\n====================================================');
    console.log(`✅ EXTRA FOLDER CLEANUP COMPLETED (${totalDeleted} objects deleted)`);
    console.log('====================================================');
}

cleanupExtraFolders().catch(err => {
    console.error('❌ Cleanup failed:', err);
});
