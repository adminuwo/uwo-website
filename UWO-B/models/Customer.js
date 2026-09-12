const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    affiliateCode: {
        type: String,
        trim: true,
        index: true
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner',
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },
    visitorId: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);
