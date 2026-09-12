const mongoose = require('mongoose');

const AffiliateLogSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: [
            'Affiliate Link Opened',
            'Customer Registered',
            'Customer Logged In',
            'Payment Success',
            'Order Created',
            'Order Cancelled',
            'Order Returned',
            'Dashboard Updated'
        ],
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
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        index: true
    },
    orderId: {
        type: String,
        trim: true,
        index: true
    },
    details: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AffiliateLog', AffiliateLogSchema);
