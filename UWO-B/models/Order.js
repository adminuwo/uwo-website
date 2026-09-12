const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
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
    paymentGateway: {
        type: String,
        required: true,
        enum: ['Razorpay', 'Cashfree', 'MockGateway'],
        default: 'Razorpay'
    },
    paymentId: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING',
        index: true
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['PENDING', 'PAID', 'COMPLETED', 'DELIVERED', 'RETURNED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
