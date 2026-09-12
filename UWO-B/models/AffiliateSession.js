const mongoose = require('mongoose');

const AffiliateSessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    visitor_id: {
        type: String,
        required: true,
        index: true
    },
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner',
        required: true,
        index: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },
    affiliate_code: {
        type: String,
        default: ''
    },
    landing_page: {
        type: String,
        default: ''
    },
    ip_address: {
        type: String,
        default: ''
    },
    user_agent: {
        type: String,
        default: ''
    },
    device: {
        type: String,
        default: 'Desktop'
    },
    browser: {
        type: String,
        default: 'Unknown'
    },
    country: {
        type: String,
        default: 'Unknown'
    },
    city: {
        type: String,
        default: 'Unknown'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_activity: {
        type: Date,
        default: Date.now
    },
    is_converted: {
        type: Boolean,
        default: false
    }
});

// Sync indexes
AffiliateSessionSchema.index({ visitor_id: 1, partner_id: 1, product_id: 1 });

module.exports = mongoose.model('AffiliateSession', AffiliateSessionSchema);
