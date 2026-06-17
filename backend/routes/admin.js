const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Book = require('../models/Book');
const Announcement = require('../models/Announcement');

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ==================== GET ALL USERS ====================
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ==================== DELETE USER (FIXED) ====================
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ Validate ID
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID provided' 
            });
        }

        // ✅ Check if ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format' 
            });
        }

        // Find and delete the user
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete user' 
        });
    }
});

// ==================== GET ALL BOOKS ====================
router.get('/books', authMiddleware, async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json({ success: true, books });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// ==================== DELETE BOOK ====================
router.delete('/books/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid book ID' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid book ID format' 
            });
        }

        const book = await Book.findByIdAndDelete(id);
        
        if (!book) {
            return res.status(404).json({ 
                success: false, 
                error: 'Book not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Book deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete book' 
        });
    }
});

// ==================== GET ALL ANNOUNCEMENTS ====================
router.get('/announcements', authMiddleware, async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json({ success: true, announcements });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// ==================== DELETE ANNOUNCEMENT ====================
router.delete('/announcements/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid announcement ID' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid announcement ID format' 
            });
        }

        const announcement = await Announcement.findByIdAndDelete(id);
        
        if (!announcement) {
            return res.status(404).json({ 
                success: false, 
                error: 'Announcement not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Announcement deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete announcement' 
        });
    }
});

// ==================== UPDATE USER ROLE ====================
router.patch('/users/:id/role', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format' 
            });
        }

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role. Must be "user" or "admin"' 
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update user role' 
        });
    }
});

module.exports = router;