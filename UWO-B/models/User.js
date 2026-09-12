const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'SALES_ADMIN'],
        default: 'SALES_ADMIN'
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
