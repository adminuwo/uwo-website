const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const storageService = require('../services/storageService');
const Project = require('../models/Project');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';
const FRONTEND_IMAGES_DIR = path.join(__dirname, '../../UWO-F/images');

async function fixProjectLogos() {
    await mongoose.connect(MONGO_URI);
    console.log('🚀 Fixing Project Logos (AISA, AI Mall, EFV)...');

    const projectFiles = [
        { name: 'AISA', localName: 'aisa-logo.svg', mime: 'image/svg+xml' },
        { name: 'AI Mall', localName: 'AIMALLL..webp', mime: 'image/webp' },
        { name: 'EFV', localName: 'EFV.png', mime: 'image/png' }
    ];

    for (const projInfo of projectFiles) {
        const filePath = path.join(FRONTEND_IMAGES_DIR, projInfo.localName);
        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠️ Local file not found: ${filePath}`);
            continue;
        }

        try {
            const uploadRes = await storageService.uploadFile({
                filePath,
                originalName: projInfo.localName,
                mimeType: projInfo.mime,
                folder: storageService.FOLDERS.PRODUCTS,
                prefix: 'project-logo',
                options: { uploadedBy: 'fix-logos-script' }
            });

            console.log(`  ✅ Uploaded to GCS: ${projInfo.name} -> ${uploadRes.url}`);

            const project = await Project.findOne({ name: new RegExp(projInfo.name, 'i'), deleted_at: null });
            if (project) {
                project.logo = uploadRes.url;
                await project.save();
                console.log(`  ✅ Updated Project DB record (${project.name}) -> ${uploadRes.url}`);
            } else {
                console.warn(`  ⚠️ Project not found in DB: ${projInfo.name}`);
            }
        } catch (err) {
            console.error(`  ❌ Error processing ${projInfo.name}:`, err.message);
        }
    }

    await mongoose.disconnect();
    console.log('====================================================');
    console.log('✅ PROJECT LOGOS SUCCESSFULLY FIXED & SAVED TO DB!');
    console.log('====================================================');
}

fixProjectLogos();
