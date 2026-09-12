const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    featuredImage: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    },
    videos: {
        type: [String],
        default: []
    },
    author: {
        type: String,
        default: 'UWO Team'
    },
    category: {
        type: String,
        default: 'AI & Automation'
    },
    tags: {
        type: [String],
        default: []
    },
    seoTitle: {
        type: String,
        default: ''
    },
    seoDescription: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    readTime: {
        type: Number,
        default: 3
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-update updatedAt field and sync featuredImage/coverImage on save
BlogSchema.pre('save', function() {
    this.updatedAt = Date.now();
    const img = this.coverImage || this.featuredImage || '';
    this.featuredImage = img;
    this.coverImage = img;
});

// Ensure both coverImage and featuredImage are included in JSON output
BlogSchema.set('toJSON', {
    transform: function(doc, ret) {
        const img = ret.coverImage || ret.featuredImage || '';
        ret.featuredImage = img;
        ret.coverImage = img;
        return ret;
    }
});

BlogSchema.set('toObject', {
    transform: function(doc, ret) {
        const img = ret.coverImage || ret.featuredImage || '';
        ret.featuredImage = img;
        ret.coverImage = img;
        return ret;
    }
});

module.exports = mongoose.model('Blog', BlogSchema);
