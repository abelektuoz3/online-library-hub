const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    author: {
        type: String,
        default: 'Admin Upload',
        trim: true,
    },
    description: {
        type: String,
        default: 'No description provided',
    },
    category: {
        type: String,
        enum: ['Fiction', 'Non-Fiction', 'Programming', 'History', 'Mathematics', 'Science', 'English', 'Arts', 'Technology', 'Other'],
        default: 'Other',
    },
    grade_level: {
        type: String,
        enum: ['Grade 8-10', 'Grade 9-11', 'Grade 9-12', 'Grade 10-12', 'Grade 11-12', 'College', 'University', 'Other'],
        default: 'Other',
    },
    resource_type: {
        type: String,
        enum: ['Book', 'E-Book', 'Textbook', 'Reference', 'Lab Manual', 'Video', 'Audio', 'Course', 'Other'],
        default: 'Other',
    },
    available: {
        type: Boolean,
        default: true,
    },
    coverImage: {
        type: String,
        default: 'https://via.placeholder.com/300x400?text=No+Cover',
    },
    fileUrl: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        default: 0,
        min: 0,
    },
    pages: {
        type: Number,
        default: null,
    },
    publisher: {
        type: String,
        default: 'Online Library Hub',
    },
    publicationYear: {
        type: Number,
        default: null,
    },
    language: {
        type: String,
        default: 'English',
    },
    isbn: {
        type: String,
        default: '',
    },
    views: {
        type: Number,
        default: 0,
    },
    downloads: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    featured: {
        type: Boolean,
        default: false,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

BookSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Book', BookSchema);