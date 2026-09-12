const mongoose = require('mongoose');

const AffiliateLinkSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    affiliateCode: {
        type: String,
        required: true,
        trim: true
    },
    generatedAffiliateUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Ensure a partner has only one link per product
AffiliateLinkSchema.index({ partnerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('AffiliateLink', AffiliateLinkSchema);
