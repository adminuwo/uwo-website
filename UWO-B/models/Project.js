const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        required: true
    },
    short_description: {
        type: String,
        required: true,
        maxlength: 300,
        trim: true
    },
    project_url: {
        type: String,
        required: true,
        trim: true
    },
    button_label: {
        type: String,
        default: 'Visit Project',
        trim: true
    },
    display_order: {
        type: Number,
        required: true,
        default: 0
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Project', projectSchema);
