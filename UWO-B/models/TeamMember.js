const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    designation: {
        type: String,
        required: true,
        trim: true
    },
    short_description: {
        type: String,
        default: '',
        maxlength: 250
    },
    full_biography: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true,
        default: 'Technology'
    },
    is_leadership: {
        type: Boolean,
        default: false
    },
    display_order: {
        type: Number,
        required: true,
        default: 0
    },
    linkedin: {
        type: String,
        default: ''
    },
    twitter: {
        type: String,
        default: ''
    },
    github: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: []
    },
    experience: {
        type: [String],
        default: []
    },
    achievements: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

// Auto-update updatedAt field on save
TeamMemberSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);

