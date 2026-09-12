const mongoose = require('mongoose');

const AffiliateClickSchema = new mongoose.Schema({
    // Legacy fields
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    affiliateCode: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    },
    device: {
        type: String,
        default: ''
    },
    browser: {
        type: String,
        default: ''
    },
    operatingSystem: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: 'Unknown'
    },
    referrer: {
        type: String,
        default: ''
    },
    landingUrl: {
        type: String,
        default: ''
    },
    sessionId: {
        type: String,
        default: ''
    },
    clickedAt: {
        type: Date,
        default: Date.now
    },

    // Session-based affiliate tracking fields
    partner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner'
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    session_id: {
        type: String,
        default: ''
    },
    visitor_id: {
        type: String,
        default: '',
        index: true
    },
    click_type: {
        type: String,
        enum: ['unique', 'total', 'sale'],
        default: 'unique'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to synchronize camelCase and snake_case properties
AffiliateClickSchema.pre('save', function() {
    if (this.partnerId && !this.partner_id) {
        this.partner_id = this.partnerId;
    } else if (this.partner_id && !this.partnerId) {
        this.partnerId = this.partner_id;
    }

    if (this.productId && !this.product_id) {
        this.product_id = this.productId;
    } else if (this.product_id && !this.productId) {
        this.productId = this.product_id;
    }

    if (this.sessionId && !this.session_id) {
        this.session_id = this.sessionId;
    } else if (this.session_id && !this.sessionId) {
        this.sessionId = this.session_id;
    }

    if (this.clickedAt && !this.created_at) {
        this.created_at = this.clickedAt;
    } else if (this.created_at && !this.clickedAt) {
        this.clickedAt = this.created_at;
    }
});

module.exports = mongoose.model('AffiliateClick', AffiliateClickSchema);
