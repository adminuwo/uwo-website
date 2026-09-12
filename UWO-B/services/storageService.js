const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let sharp = null;
try {
    sharp = require('sharp');
} catch (err) {
    console.warn('⚠️ Sharp module not loaded (running without Sharp image optimization):', err.message);
}

/**
 * StorageService - Production-ready Google Cloud Storage service for UWO Platform.
 * Single source of truth for all asset storage, retrieval, optimization, and lifecycle operations.
 */
class StorageService {
    constructor() {
        this.bucketName = process.env.GCP_BUCKET_NAME || process.env.GCS_BUCKET_NAME || process.env.BUCKET_NAME || 'uwo-document';
        this.projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || 'unified-web-options';
        
        const storageConfig = { projectId: this.projectId };
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
            storageConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }

        try {
            this.storage = new Storage(storageConfig);
            this.bucket = this.storage.bucket(this.bucketName);
            console.log(`🪣 StorageService initialized for bucket: ${this.bucketName} (Project: ${this.projectId})`);
        } catch (err) {
            console.error('❌ StorageService initialization error:', err.message);
        }

        // Folder hierarchy definition (Exact Specification)
        this.FOLDERS = {
            BLOGS: 'blogs/images/',
            PRODUCTS: 'products/logos/',
            RAG: 'rag/documents/',
            TEAM: 'team/images/',
            LOGOS: 'logos/',
            TEMP: 'temp/'
        };

        // Allowed extensions and MIME types
        this.ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];
        this.ALLOWED_DOC_EXTS = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.pptx', '.md', '.markdown'];

        this.MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB
        this.MAX_DOC_SIZE = 100 * 1024 * 1024;   // 100 MB
    }

    /**
     * Ensure standard folder hierarchy exists in GCS by uploading zero-byte placeholder markers.
     */
    async initFolderHierarchy() {
        if (!this.bucket) return;
        try {
            for (const [key, folderPath] of Object.entries(this.FOLDERS)) {
                const placeholder = this.bucket.file(`${folderPath}.keep`);
                const [exists] = await placeholder.exists();
                if (!exists) {
                    await placeholder.save('', {
                        metadata: { contentType: 'text/plain' }
                    });
                    console.log(`📁 Initialized GCS folder: ${folderPath}`);
                }
            }
        } catch (err) {
            console.warn('⚠️ Could not initialize folder hierarchy markers:', err.message);
        }
    }

    /**
     * Sanitize filename to prevent path traversal and invalid characters.
     */
    sanitizeFilename(name) {
        if (!name) return 'file';
        // Strip directory separators & path traversal tokens
        const safeBase = path.basename(name).replace(/[^a-zA-Z0-9.\-_]/g, '-');
        return safeBase.replace(/-+/g, '-');
    }

    /**
     * Generate unique prefix-based filename (e.g. team-1728938234-a1b2c3d4.webp)
     */
    generateUniqueFilename(prefix = 'asset', originalName = '', targetExt = '') {
        const timestamp = Date.now();
        const randomHash = crypto.randomBytes(4).toString('hex');
        const ext = targetExt || path.extname(originalName).toLowerCase() || '.bin';
        const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${cleanPrefix}-${timestamp}-${randomHash}${ext}`;
    }

    /**
     * Optimize image buffer (compress, resize, convert to WebP) if applicable.
     */
    async optimizeImage(buffer, mimeType, options = {}) {
        // Return original if sharp is not loaded, or SVG, or empty buffer
        if (!sharp || mimeType === 'image/svg+xml' || !buffer) {
            const fallbackExt = (mimeType && mimeType.split('/')[1]) ? `.${mimeType.split('/')[1]}` : '.png';
            return { buffer, format: mimeType, mimeType, extension: fallbackExt };
        }

        try {
            let pipeline = sharp(buffer);
            const metadata = await pipeline.metadata();

            // Resize if maxWidth/maxHeight provided or exceeds 2048px
            const maxWidth = options.maxWidth || 2048;
            if (metadata.width && metadata.width > maxWidth) {
                pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
            }

            // Convert raster formats to WebP
            const quality = options.quality || 80;
            const optimizedBuffer = await pipeline
                .webp({ quality, effort: 4 })
                .toBuffer();

            return {
                buffer: optimizedBuffer,
                format: 'webp',
                mimeType: 'image/webp',
                extension: '.webp'
            };
        } catch (err) {
            console.warn('⚠️ Sharp image optimization fallback to original:', err.message);
            const fallbackExt = mimeType.split('/')[1] ? `.${mimeType.split('/')[1]}` : '.png';
            return { buffer, format: mimeType, mimeType, extension: fallbackExt };
        }
    }

    /**
     * Core Upload File method
     * Supports both File Path and Buffer inputs.
     */
    async uploadFile({ buffer, filePath, originalName, mimeType, folder = 'temp/', filename, prefix = 'asset', options = {} }) {
        if (!this.bucket) throw new Error('GCS bucket is not initialized');

        let fileBuffer = buffer;
        if (!fileBuffer && filePath) {
            fileBuffer = fs.readFileSync(filePath);
        }

        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error('No content provided for file upload');
        }

        const ext = path.extname(originalName || '').toLowerCase();
        const isImage = this.ALLOWED_IMAGE_EXTS.includes(ext) || (mimeType && mimeType.startsWith('image/'));
        const isDoc = this.ALLOWED_DOC_EXTS.includes(ext) || (mimeType && (mimeType.startsWith('application/') || mimeType.startsWith('text/')));

        if (!isImage && !isDoc) {
            throw new Error(`Unsupported file format/MIME type: ${ext} (${mimeType})`);
        }

        // Validate File Size
        if (isImage && fileBuffer.length > this.MAX_IMAGE_SIZE) {
            throw new Error(`Image size exceeds max limit of ${this.MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
        }
        if (isDoc && fileBuffer.length > this.MAX_DOC_SIZE) {
            throw new Error(`Document size exceeds max limit of ${this.MAX_DOC_SIZE / (1024 * 1024)}MB`);
        }

        let finalBuffer = fileBuffer;
        let finalMimeType = mimeType || 'application/octet-stream';
        let finalExtension = ext;

        // Perform image optimization if uploading image (unless options.skipOptimization is true)
        if (isImage && !options.skipOptimization && ext !== '.svg') {
            const optResult = await this.optimizeImage(fileBuffer, mimeType, options);
            finalBuffer = optResult.buffer;
            finalMimeType = optResult.mimeType;
            finalExtension = optResult.extension;
        }

        // Ensure folder path ends with slash
        const targetFolder = folder.endsWith('/') ? folder : `${folder}/`;
        
        // Determine destination object name inside bucket
        const uniqueName = filename || this.generateUniqueFilename(prefix, originalName, finalExtension);
        const destinationPath = `${targetFolder}${uniqueName}`;

        const gcsFile = this.bucket.file(destinationPath);

        const startTime = Date.now();
        console.log(`====================================================`);
        console.log(`🚀 [GCS UPLOAD STARTED]`);
        console.log(`   🪣 Bucket Name : ${this.bucketName}`);
        console.log(`   📂 Target Folder: ${targetFolder}`);
        console.log(`   📄 Filename     : ${uniqueName}`);
        console.log(`   🏷️ Original Name: ${originalName || uniqueName}`);
        console.log(`   🎨 MIME Type    : ${finalMimeType}`);
        console.log(`====================================================`);

        try {
            await gcsFile.save(finalBuffer, {
                metadata: {
                    contentType: finalMimeType,
                    cacheControl: 'public, max-age=31536000, immutable',
                    metadata: {
                        originalName: originalName || uniqueName,
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: options.uploadedBy || 'system'
                    }
                },
                resumable: false
            });

            try {
                await gcsFile.makePublic();
            } catch (pubErr) {
                // Uniform bucket-level access enabled; public URL will still work
            }

            const durationMs = Date.now() - startTime;
            const publicUrl = this.getPublicUrl(destinationPath);

            console.log(`✅ [GCS UPLOAD SUCCESS]`);
            console.log(`   🔗 Public URL  : ${publicUrl}`);
            console.log(`   ⏱️ Time Taken  : ${durationMs}ms`);
            console.log(`====================================================`);

            return {
                bucketPath: destinationPath,
                url: publicUrl,
                filename: uniqueName,
                originalName: originalName || uniqueName,
                mimeType: finalMimeType,
                size: finalBuffer.length,
                uploadedAt: new Date(),
                timeTakenMs: durationMs
            };
        } catch (err) {
            console.error(`❌ [GCS UPLOAD FAILED]`);
            console.error(`   🪣 Bucket: ${this.bucketName}`);
            console.error(`   📄 Destination: ${destinationPath}`);
            console.error(`   ⚠️ Error Stack:`, err.stack || err.message);
            console.log(`====================================================`);
            throw new Error(`Google Cloud Storage upload failed: ${err.message}`);
        }
    }

    /**
     * Get standard public URL for an object path in the bucket.
     */
    getPublicUrl(objectPath) {
        if (!objectPath) return '';
        // If objectPath is already a full URL, extract path or return as is
        if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) {
            return objectPath;
        }
        const cleanPath = objectPath.replace(/^\/+/, '');
        return `https://storage.googleapis.com/${this.bucketName}/${cleanPath}`;
    }

    /**
     * Extract relative GCS object path from full GCS URL or relative path.
     */
    extractObjectPath(fileUrlOrPath) {
        if (!fileUrlOrPath) return '';
        if (fileUrlOrPath.startsWith(`https://storage.googleapis.com/${this.bucketName}/`)) {
            return fileUrlOrPath.replace(`https://storage.googleapis.com/${this.bucketName}/`, '');
        }
        if (fileUrlOrPath.startsWith('https://storage.googleapis.com/')) {
            const parts = fileUrlOrPath.replace('https://storage.googleapis.com/', '').split('/');
            parts.shift(); // remove bucket name
            return parts.join('/');
        }
        return fileUrlOrPath.replace(/^\/+/, '');
    }

    /**
     * Delete file from GCS bucket.
     */
    async deleteFile(fileUrlOrPath) {
        if (!this.bucket || !fileUrlOrPath) return false;
        const objectPath = this.extractObjectPath(fileUrlOrPath);
        if (!objectPath) return false;

        try {
            const gcsFile = this.bucket.file(objectPath);
            await gcsFile.delete({ ignoreNotFound: true });
            console.log(`🗑️ Deleted GCS object: gs://${this.bucketName}/${objectPath}`);
            return true;
        } catch (err) {
            if (err.code === 404 || err.status === 404) return true;
            console.warn(`⚠️ GCS delete info (${objectPath}):`, err.message);
            return false;
        }
    }

    /**
     * Replace existing file in GCS bucket: upload new file and remove old file.
     */
    async replaceFile({ oldUrlOrPath, file, buffer, filePath, originalName, mimeType, folder, prefix, options }) {
        const uploadResult = await this.uploadFile({
            buffer,
            filePath,
            originalName,
            mimeType,
            folder,
            prefix,
            options
        });

        if (oldUrlOrPath) {
            await this.deleteFile(oldUrlOrPath);
        }

        return uploadResult;
    }

    /**
     * Check if a file exists in the GCS bucket.
     */
    async fileExists(fileUrlOrPath) {
        if (!this.bucket || !fileUrlOrPath) return false;
        const objectPath = this.extractObjectPath(fileUrlOrPath);
        try {
            const [exists] = await this.bucket.file(objectPath).exists();
            return exists;
        } catch (err) {
            return false;
        }
    }

    /**
     * Generate signed URL for private bucket objects.
     */
    async generateSignedUrl(fileUrlOrPath, options = {}) {
        if (!this.bucket || !fileUrlOrPath) return '';
        const objectPath = this.extractObjectPath(fileUrlOrPath);
        const action = options.action || 'read';
        const expires = options.expires || Date.now() + 60 * 60 * 1000; // 1 hour

        try {
            const [url] = await this.bucket.file(objectPath).getSignedUrl({
                version: 'v4',
                action,
                expires
            });
            return url;
        } catch (err) {
            console.warn('⚠️ Signed URL generation failed (using public URL fallback):', err.message);
            return this.getPublicUrl(objectPath);
        }
    }

    /**
     * List files in GCS bucket matching a prefix.
     */
    async listFiles(prefix = '') {
        if (!this.bucket) return [];
        try {
            const [files] = await this.bucket.getFiles({ prefix });
            return files.map(file => ({
                name: file.name,
                size: parseInt(file.metadata.size || '0', 10),
                updated: file.metadata.updated,
                contentType: file.metadata.contentType,
                url: this.getPublicUrl(file.name)
            }));
        } catch (err) {
            console.error('❌ Error listing files from GCS:', err.message);
            return [];
        }
    }

    /**
     * Move/Rename file inside GCS bucket.
     */
    async moveFile(srcUrlOrPath, destPath) {
        if (!this.bucket) return null;
        const srcPath = this.extractObjectPath(srcUrlOrPath);
        try {
            const srcFile = this.bucket.file(srcPath);
            const destFile = this.bucket.file(destPath);
            await srcFile.move(destFile);
            console.log(`📦 Moved GCS object from ${srcPath} to ${destPath}`);
            return this.getPublicUrl(destPath);
        } catch (err) {
            console.error(`❌ Error moving GCS file from ${srcPath} to ${destPath}:`, err.message);
            throw err;
        }
    }
}

module.exports = new StorageService();
