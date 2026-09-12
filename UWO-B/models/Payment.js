const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        index: true
    },
    gateway: {
        type: String,
        required: true,
        enum: ['Razorpay', 'Cashfree', 'MockGateway'],
        default: 'Razorpay'
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
    status: {
        type: String,
        required: true,
        default: 'captured'
    },
    rawPayload: {
        type: String,
        default: ''
    },
    signature: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
