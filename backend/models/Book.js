const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    category: {
        type: String,
        enum: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Poetry', 'Drama', 'Religion', 'Self-Help', 'Technology', 'Travel', 'Other', 'Programming', 'Mathematics', 'English', 'Arts'],
        default: 'Other',
    },
    // Grade Level field
    grade_level: {
        type: String,
        enum: ['Grade 8-10', 'Grade 9-11', 'Grade 9-12', 'Grade 10-12', 'Grade 11-12', 'College', 'University', 'Other'],
        default: 'Other',
    },
    // Resource Type field
    resource_type: {
        type: String,
        enum: ['Book', 'E-Book', 'Textbook', 'Reference', 'Lab Manual', 'Video', 'Audio', 'Course', 'Other'],
        default: 'Other',
    },
    // Availability status
    available: {
        type: Boolean,
        default: true,
    },
    coverImage: {
        type: String,
        required: [true, 'Cover image is required'],
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
    },
    price: {
        type: Number,
        default: 0,
        min: 0,
    },
    pages: {
        type: Number,
        min: 1,
        default: null,
    },
    publisher: {
        type: String,
        trim: true,
        default: '',
    },
    publicationYear: {
        type: Number,
        min: 1000,
        max: new Date().getFullYear(),
        default: null,
    },
    language: {
        type: String,
        default: 'English',
    },
    isbn: {
        type: String,
        trim: true,
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

// Update the updatedAt timestamp on save
BookSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Book', BookSchema);