const mongoose = require('mongoose');

const AffiliateLeadSchema = new mongoose.Schema({
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
        default: '',
        trim: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Converted'],
        default: 'New'
    },
    leadSource: {
        type: String,
        default: 'web'
    },
    visitor_id: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AffiliateLead', AffiliateLeadSchema);
