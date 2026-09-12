const mongoose = require('mongoose');

const LegalPageSchema = new mongoose.Schema({
    page_type: {
        type: String,
        required: true,
        unique: true,
        enum: ['privacy', 'terms', 'cookies']
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    version: {
        type: Number,
        default: 0
    },
    // SEO Fields (Active/Published)
    seoTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    openGraphTitle: { type: String, default: '' },
    openGraphDescription: { type: String, default: '' },
    openGraphImage: { type: String, default: '' },
    robots: { type: String, default: 'Index' },

    // Draft/WIP fields (What the admin edits)
    draftTitle: { type: String, default: '' },
    draftContent: { type: String, default: '' },
    draftSeoTitle: { type: String, default: '' },
    draftMetaDescription: { type: String, default: '' },
    draftMetaKeywords: { type: String, default: '' },
    draftCanonicalUrl: { type: String, default: '' },
    draftOpenGraphTitle: { type: String, default: '' },
    draftOpenGraphDescription: { type: String, default: '' },
    draftOpenGraphImage: { type: String, default: '' },
    draftRobots: { type: String, default: 'Index' },

    created_by: { type: String, default: 'Admin' },
    updated_by: { type: String, default: 'Admin' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    published_at: { type: Date }
});

// Auto-update updated_at field on save
LegalPageSchema.pre('save', function() {
    this.updated_at = Date.now();
});

module.exports = mongoose.model('LegalPage', LegalPageSchema);
