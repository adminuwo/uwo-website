const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    page_type: {
        type: String,
        required: true,
        enum: ['privacy', 'terms', 'cookies']
    },
    performed_by: {
        type: String,
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
