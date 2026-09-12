const mongoose = require('mongoose');

const AffiliateLoginSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },
    affiliateCode: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    customerName: {
        type: String,
        default: '',
        trim: true
    },
    visitorId: {
        type: String,
        default: ''
    },
    sessionId: {
        type: String,
        default: ''
    },
    browser: {
        type: String,
        default: ''
    },
    device: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    },
    loginTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Unique constraint: one login record per customer email per affiliate code
// This ensures the same customer logging in multiple times is counted only once
AffiliateLoginSchema.index({ customerEmail: 1, affiliateCode: 1 }, { unique: true });

module.exports = mongoose.model('AffiliateLogin', AffiliateLoginSchema);
