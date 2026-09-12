const mongoose = require('mongoose');

const ReferralSubmissionSchema = new mongoose.Schema({
    name: {
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
        required: false,
        default: '',
        trim: true
    },
    upiId: {
        type: String,
        trim: true,
        default: ''
    },
    preferredProgram: {
        type: String,
        trim: true,
        default: 'All Platforms'
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'approved', 'rejected'],
        default: 'pending'
    },
    affiliateCode: {
        type: String,
        trim: true,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ReferralSubmission', ReferralSubmissionSchema);
