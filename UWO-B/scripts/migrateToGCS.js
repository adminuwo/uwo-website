const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const storageService = require('../services/storageService');

// Import MongoDB Models
const Document = require('../models/Document');
const Blog = require('../models/Blog');
const TeamMember = require('../models/TeamMember');
const Project = require('../models/Project');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uwo_database';
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const FRONTEND_IMAGES_DIR = path.join(__dirname, '../../UWO-F/images');

async function migrate() {
    const startTime = Date.now();
    console.log('====================================================');
    console.log('🚀 STARTING UWO DATA & ASSET MIGRATION TO GCS');
    console.log('====================================================');
    console.log(`📌 MongoDB URI: ${MONGO_URI.replace(/:[^@]+@/, ":****@")}`);
    console.log(`🪣 Target GCS Bucket: ${storageService.bucketName}`);

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ Connected to MongoDB');

    await storageService.initFolderHierarchy();

    let totalUploaded = 0;
    let totalBytesMigrated = 0;
    let errorsCount = 0;

    /**
     * Helper to find local file path across uploads/ and frontend images/
     */
    function findLocalFile(filenameOrPath) {
        if (!filenameOrPath) return null;
        let cleanName = path.basename(filenameOrPath);
        
        // Remove query parameters if present
        cleanName = cleanName.split('?')[0];

        // Also check if path contains /api/media/team-images/... or similar subpath
        if (filenameOrPath.includes('/api/media/')) {
            const rawSub = filenameOrPath.split('/api/media/')[1];
            if (rawSub) cleanName = path.basename(rawSub);
        }

        const possiblePaths = [
            path.join(UPLOADS_DIR, cleanName),
            path.join(FRONTEND_IMAGES_DIR, cleanName),
            path.join(__dirname, '..', filenameOrPath.replace(/^\/+/, '')),
            path.join(__dirname, '../../UWO-F', filenameOrPath.replace(/^\/+/, ''))
        ];

        // Also check exact filename search inside uploads directory
        if (fs.existsSync(UPLOADS_DIR)) {
            const uploadFiles = fs.readdirSync(UPLOADS_DIR);
            const matchedFile = uploadFiles.find(f => f.toLowerCase() === cleanName.toLowerCase() || f.endsWith(cleanName));
            if (matchedFile) {
                possiblePaths.unshift(path.join(UPLOADS_DIR, matchedFile));
            }
        }

        for (const p of possiblePaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
                return p;
            }
        }
        return null;
    }

    // ----------------------------------------------------
    // 1. Migrate RAG Documents
    // ----------------------------------------------------
    console.log('\n📄 Processing RAG Documents...');
    const docs = await Document.find();
    for (const doc of docs) {
        if (doc.fileUrl && doc.fileUrl.startsWith('https://storage.googleapis.com')) {
            console.log(`  ✓ Document ${doc.fileName} already on GCS`);
            continue;
        }

        const localPath = findLocalFile(doc.fileUrl || doc.fileName);
        if (localPath) {
            try {
                const uploadRes = await storageService.uploadFile({
                    filePath: localPath,
                    originalName: doc.fileName || path.basename(localPath),
                    mimeType: doc.fileType || 'application/pdf',
                    folder: storageService.FOLDERS.RAG,
                    prefix: 'rag',
                    options: { uploadedBy: 'migration-script' }
                });

                doc.fileUrl = uploadRes.url;
                await doc.save();

                totalUploaded++;
                totalBytesMigrated += uploadRes.size;
                console.log(`  ✅ Migrated Document: ${doc.fileName} -> ${uploadRes.url}`);
            } catch (err) {
                console.error(`  ❌ Error migrating document ${doc.fileName}:`, err.message);
                errorsCount++;
            }
        } else {
            console.warn(`  ⚠️ Could not find local file for Document: ${doc.fileName} (${doc.fileUrl})`);
        }
    }

    // ----------------------------------------------------
    // 2. Migrate Team Members
    // ----------------------------------------------------
    console.log('\n👥 Processing Team Member Images...');
    const teamMembers = await TeamMember.find({ deletedAt: null });
    for (const member of teamMembers) {
        if (!member.image || member.image.startsWith('https://storage.googleapis.com')) {
            console.log(`  ✓ Team member ${member.name} image already on GCS or empty`);
            continue;
        }

        const localPath = findLocalFile(member.image);
        if (localPath) {
            try {
                const uploadRes = await storageService.uploadFile({
                    filePath: localPath,
                    originalName: path.basename(localPath),
                    mimeType: 'image/webp',
                    folder: storageService.FOLDERS.TEAM,
                    prefix: 'team',
                    options: { uploadedBy: 'migration-script' }
                });

                member.image = uploadRes.url;
                await member.save();

                totalUploaded++;
                totalBytesMigrated += uploadRes.size;
                console.log(`  ✅ Migrated Team Member Image (${member.name}): ${uploadRes.url}`);
            } catch (err) {
                console.error(`  ❌ Error migrating team member ${member.name}:`, err.message);
                errorsCount++;
            }
        } else {
            console.warn(`  ⚠️ Assigning GCS bucket URL for Team Member: ${member.name} (${member.image})`);
            const fallbackPath = storageService.FOLDERS.TEAM + storageService.sanitizeFilename(path.basename(member.image || 'team.webp'));
            member.image = storageService.getPublicUrl(fallbackPath);
            await member.save();
        }
    }

    // Auto-sync Categories from Team Members
    console.log('\n🏷️ Syncing Team Categories into Category Collection...');
    const teamDepts = await TeamMember.distinct('category', { deletedAt: null });
    const defaultDepts = [
        'Business Development', 'HR', 'Engineering', 'Marketing', 
        'Operations', 'Research', 'Finance', 'AI Research', 'Legal', 'Sales', 'Technology', 'Design'
    ];
    const allDepts = Array.from(new Set([...teamDepts, ...defaultDepts]));
    const Category = require('../models/Category');

    for (const deptName of allDepts) {
        if (!deptName) continue;
        const slug = deptName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        const count = await TeamMember.countDocuments({ category: deptName, deletedAt: null });
        await Category.findOneAndUpdate(
            { name: deptName },
            { name: deptName, slug: slug, usageCount: count },
            { upsert: true, new: true }
        );
        console.log(`  ✓ Category synced: ${deptName} (${count} members)`);
    }

    // ----------------------------------------------------
    // 3. Migrate Blogs
    // ----------------------------------------------------
    console.log('\n📝 Processing Blog Images...');
    const blogs = await Blog.find();
    for (const blog of blogs) {
        let updated = false;

        const imgFields = ['coverImage', 'featuredImage'];
        for (const field of imgFields) {
            const val = blog[field];
            if (val && !val.startsWith('https://storage.googleapis.com')) {
                const localPath = findLocalFile(val);
                if (localPath) {
                    try {
                        const uploadRes = await storageService.uploadFile({
                            filePath: localPath,
                            originalName: path.basename(localPath),
                            mimeType: 'image/webp',
                            folder: storageService.FOLDERS.BLOGS,
                            prefix: 'blog',
                            options: { uploadedBy: 'migration-script' }
                        });

                        blog[field] = uploadRes.url;
                        updated = true;
                        totalUploaded++;
                        totalBytesMigrated += uploadRes.size;
                        console.log(`  ✅ Migrated Blog Image (${blog.slug} - ${field}): ${uploadRes.url}`);
                    } catch (err) {
                        console.error(`  ❌ Error migrating blog ${blog.slug} (${field}):`, err.message);
                        errorsCount++;
                    }
                } else {
                    console.warn(`  ⚠️ Assigning GCS bucket URL for Blog Image (${blog.slug} - ${field})`);
                    const fallbackPath = storageService.FOLDERS.BLOGS + storageService.sanitizeFilename(path.basename(val || 'blog.webp'));
                    blog[field] = storageService.getPublicUrl(fallbackPath);
                    updated = true;
                }
            }
        }

        if (Array.isArray(blog.images) && blog.images.length > 0) {
            const newImages = [];
            for (const imgUrl of blog.images) {
                if (imgUrl.startsWith('https://storage.googleapis.com')) {
                    newImages.push(imgUrl);
                    continue;
                }
                const localPath = findLocalFile(imgUrl);
                if (localPath) {
                    try {
                        const uploadRes = await storageService.uploadFile({
                            filePath: localPath,
                            originalName: path.basename(localPath),
                            mimeType: 'image/webp',
                            folder: storageService.FOLDERS.BLOGS,
                            prefix: 'blog',
                            options: { uploadedBy: 'migration-script' }
                        });
                        newImages.push(uploadRes.url);
                        updated = true;
                        totalUploaded++;
                        totalBytesMigrated += uploadRes.size;
                    } catch (e) {
                        newImages.push(imgUrl);
                    }
                } else {
                    newImages.push(imgUrl);
                }
            }
            blog.images = newImages;
        }

        if (updated) {
            await blog.save();
        }
    }

    // ----------------------------------------------------
    // 4. Migrate Projects (Flagship Logos -> products/logos/)
    // ----------------------------------------------------
    console.log('\n🚀 Processing Projects Logos...');
    const projects = await Project.find({ deleted_at: null });
    for (const project of projects) {
        if (project.logo && project.logo.includes('/products/logos/')) {
            console.log(`  ✓ Project ${project.name} logo already in products/logos/`);
            continue;
        }

        const localPath = findLocalFile(project.logo);
        if (localPath) {
            try {
                const uploadRes = await storageService.uploadFile({
                    filePath: localPath,
                    originalName: path.basename(localPath),
                    mimeType: path.extname(localPath) === '.svg' ? 'image/svg+xml' : 'image/webp',
                    folder: storageService.FOLDERS.PRODUCTS,
                    prefix: 'project-logo',
                    options: { uploadedBy: 'migration-script' }
                });

                project.logo = uploadRes.url;
                await project.save();

                totalUploaded++;
                totalBytesMigrated += uploadRes.size;
                console.log(`  ✅ Migrated Project Logo (${project.name}): ${uploadRes.url}`);
            } catch (err) {
                console.error(`  ❌ Error migrating project logo ${project.name}:`, err.message);
                errorsCount++;
            }
        } else if (project.logo) {
            const fallbackPath = storageService.FOLDERS.PRODUCTS + storageService.sanitizeFilename(path.basename(project.logo || 'project-logo.webp'));
            project.logo = storageService.getPublicUrl(fallbackPath);
            await project.save();
            console.log(`  ✓ Mapped Project Logo (${project.name}): ${project.logo}`);
        }
    }

    // ----------------------------------------------------
    // 5. Migrate remaining static frontend images to GCS
    // ----------------------------------------------------
    console.log('\n🖼️ Syncing Static Frontend Images to GCS Bucket...');
    if (fs.existsSync(FRONTEND_IMAGES_DIR)) {
        const imageFiles = fs.readdirSync(FRONTEND_IMAGES_DIR);
        for (const file of imageFiles) {
            const filePath = path.join(FRONTEND_IMAGES_DIR, file);
            if (!fs.statSync(filePath).isFile()) continue;

            const ext = path.extname(file).toLowerCase();
            if (!storageService.ALLOWED_IMAGE_EXTS.includes(ext)) continue;

            let folder = storageService.FOLDERS.LOGOS;
            let prefix = 'logo';

            if (file.startsWith('team-') || file.includes('aditi') || file.includes('founder')) {
                folder = storageService.FOLDERS.TEAM;
                prefix = 'team';
            } else if (file.includes('bg') || file.includes('hero') || file.includes('vision') || file.includes('mission')) {
                folder = storageService.FOLDERS.BANNERS;
                prefix = 'banner';
            } else if (file.includes('logo') || file.includes('AWS') || file.includes('DigitalOcean') || file.includes('amazon') || file.includes('mongodb') || file.includes('azure') || file.includes('tavily')) {
                folder = storageService.FOLDERS.LOGOS;
                prefix = 'logo';
            }

            try {
                // Check if already uploaded
                const targetFilename = storageService.sanitizeFilename(file);
                const gcsPath = `${folder}${targetFilename}`;
                const exists = await storageService.fileExists(gcsPath);

                if (!exists) {
                    const uploadRes = await storageService.uploadFile({
                        filePath,
                        originalName: file,
                        filename: targetFilename,
                        folder,
                        prefix,
                        options: { uploadedBy: 'migration-script' }
                    });
                    totalUploaded++;
                    totalBytesMigrated += uploadRes.size;
                    console.log(`  ✅ Uploaded static asset ${file} -> ${uploadRes.url}`);
                } else {
                    console.log(`  ✓ Static asset ${file} already exists at ${gcsPath}`);
                }
            } catch (err) {
                console.error(`  ❌ Error uploading static asset ${file}:`, err.message);
                errorsCount++;
            }
        }
    }

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    const mbMigrated = (totalBytesMigrated / (1024 * 1024)).toFixed(2);

    console.log('\n====================================================');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`⏱️ Total Time Elapsed: ${elapsedSeconds} seconds`);
    console.log(`📦 Files Uploaded: ${totalUploaded}`);
    console.log(`📊 Data Migrated: ${mbMigrated} MB`);
    console.log(`⚠️ Errors Encounted: ${errorsCount}`);
    console.log('====================================================\n');

    await mongoose.disconnect();
}

if (require.main === module) {
    migrate().catch(err => {
        console.error('❌ Migration script failed:', err);
        process.exit(1);
    });
}

module.exports = migrate;
