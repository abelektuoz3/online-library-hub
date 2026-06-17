const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Poetry', 'Drama', 'Religion', 'Self-Help', 'Technology', 'Travel', 'Other'],
        default: 'Other',
    },
    coverImage: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: 0,
        min: 0,
    },
    pages: {
        type: Number,
        min: 1,
    },
    publisher: {
        type: String,
        trim: true,
    },
    publicationYear: {
        type: Number,
        min: 1000,
        max: new Date().getFullYear(),
    },
    language: {
        type: String,
        default: 'English',
    },
    isbn: {
        type: String,
        trim: true,
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