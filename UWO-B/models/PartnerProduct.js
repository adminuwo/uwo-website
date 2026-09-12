const mongoose = require('mongoose');

const PartnerProductSchema = new mongoose.Schema({
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
    commission: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Compound unique index ensuring a partner has at most one record per product
PartnerProductSchema.index({ partnerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('PartnerProduct', PartnerProductSchema);
