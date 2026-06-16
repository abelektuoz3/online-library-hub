const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    grade_level: {
        type: String,
        trim: true
    },
    resource_type: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    file_url: {
        type: String,
        default: ''
    },
    file_type: {
        type: String,
        enum: ['pdf', 'video', 'audio', 'none'],
        default: 'none'
    },
    available: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Map _id to id in JSON output for frontend compatibility
resourceSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Resource', resourceSchema);