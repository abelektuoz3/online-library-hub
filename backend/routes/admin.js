const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Book = require('../models/Book');
const Announcement = require('../models/Announcement');

// ==================== ADMIN LOGIN (NO AUTH REQUIRED) ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: 'admin' 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error during login' 
        });
    }
});

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'No token provided' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find admin
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                error: 'Admin not found' 
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Token expired' 
            });
        }
        
        res.status(401).json({ 
            success: false, 
            error: 'Authentication failed' 
        });
    }
};

// ==================== VERIFY TOKEN ROUTE ====================
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            admin: {
                id: req.admin._id,
                name: req.admin.name,
                email: req.admin.email,
                role: req.admin.role
            }
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to verify token' 
        });
    }
});

// ==================== USER ROUTES ====================

// GET all users
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// DELETE user
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID provided' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format' 
            });
        }

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

// UPDATE user role
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

// ==================== BOOK ROUTES ====================

// GET all books
router.get('/books', authMiddleware, async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json({ success: true, books });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// DELETE book
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

// ==================== ANNOUNCEMENT ROUTES ====================

// GET all announcements
router.get('/announcements', authMiddleware, async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json({ success: true, announcements });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// DELETE announcement
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

// ==================== STATS ROUTES ====================

// GET admin stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await Admin.countDocuments();
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const totalBooks = await Book.countDocuments();
        const totalAnnouncements = await Announcement.countDocuments();

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalAdmins,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
                totalBooks,
                totalAnnouncements,
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;