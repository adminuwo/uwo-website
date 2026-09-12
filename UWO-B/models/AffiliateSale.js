const mongoose = require('mongoose');

const AffiliateSaleSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPartner',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    affiliateCode: {
        type: String,
        default: '',
        trim: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    customerName: {
        type: String,
        default: '',
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed', 'refunded'],
        default: 'paid'
    },
    transactionId: {
        type: String,
        default: ''
    },
    orderStatus: {
        type: String,
        enum: ['completed', 'returned', 'cancelled', 'pending'],
        default: 'completed'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    commissionRate: {
        type: Number,
        default: 0
    },
    commissionEarned: {
        type: Number,
        default: 0
    },
    paymentGateway: {
        type: String,
        default: 'Razorpay',
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AffiliateSale', AffiliateSaleSchema);
