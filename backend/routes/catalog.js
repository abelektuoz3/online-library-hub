const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');

// GET all books/resources
router.get('/', async (req, res) => {
    try {
        console.log('📚 Fetching all books...');
        const books = await Book.find().sort({ createdAt: -1 });
        console.log(`✅ Found ${books.length} books`);
        
        res.json({ 
            success: true, 
            books: books,
            count: books.length 
        });
    } catch (error) {
        console.error('❌ Error fetching catalog:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch catalog',
            details: error.message 
        });
    }
});

// GET single book by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📚 Fetching book with ID: ${id}`);
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid book ID format'
            });
        }

        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        res.json({ success: true, book });
    } catch (error) {
        console.error('❌ Error fetching book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch book'
        });
    }
});

module.exports = router;