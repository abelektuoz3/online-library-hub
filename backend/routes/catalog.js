const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// GET all books/resources
router.get('/', async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            books: books,
            count: books.length 
        });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch catalog' 
        });
    }
});

// GET single book by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
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
        console.error('Error fetching book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch book'
        });
    }
});

module.exports = router;