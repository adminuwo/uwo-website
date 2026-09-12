const mongoose = require('mongoose');

const SalesPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        trim: true,
        default: ''
    },
    city: {
        type: String,
        trim: true,
        default: ''
    },
    passwordHash: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'disabled', 'pending', 'rejected'],
        default: 'active'
    },
    affiliateCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    lastLoginAt: {
        type: Date
    },
    permissions: {
        allowGenerateLink: { type: Boolean, default: true },
        allowViewAnalytics: { type: Boolean, default: true },
        allowDownloadReports: { type: Boolean, default: true },
        allowWithdrawEarnings: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SalesPartner', SalesPartnerSchema);
