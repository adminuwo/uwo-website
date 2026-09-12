const mongoose = require('mongoose');

const LegalPageVersionSchema = new mongoose.Schema({
    page_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegalPage',
        required: true
    },
    page_type: {
        type: String,
        required: true,
        enum: ['privacy', 'terms', 'cookies']
    },
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    version: {
        type: Number,
        required: true
    },
    // SEO Fields
    seoTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    openGraphTitle: { type: String, default: '' },
    openGraphDescription: { type: String, default: '' },
    openGraphImage: { type: String, default: '' },
    robots: { type: String, default: 'Index' },

    notes: {
        type: String,
        default: ''
    },
    updated_by: {
        type: String,
        default: 'Admin'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LegalPageVersion', LegalPageVersionSchema);
