const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    landingUrl: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    icon: {
        type: String,
        trim: true,
        default: ''
    },
    themeColor: {
        type: String,
        trim: true,
        default: ''
    },
    commissionType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    commissionValue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
