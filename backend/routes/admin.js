const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Resource = require('../models/Resource');

const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        
        req.admin = admin;
        next();
    } catch (err) {
        console.error('Admin verification error:', err);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ==================== ADMIN AUTH ROUTES ====================

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await admin.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Register (First admin only - requires no existing admin)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;

        // Check if any admin already exists
        const existingAdminCount = await Admin.countDocuments();
        if (existingAdminCount > 0) {
            return res.status(403).json({ error: 'Admin already exists. Only one admin account can be created.' });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const admin = new Admin({
            name,
            email: email.toLowerCase(),
            password
        });

        await admin.save();

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Admin registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify admin token
router.get('/verify', verifyAdmin, async (req, res) => {
    res.json({ success: true, isAdmin: true, admin: req.admin });
});

// ==================== DASHBOARD STATS ====================
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalResources = await Resource.countDocuments();
        const unreadMessages = await Feedback.countDocuments({ is_read: false });
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalResources,
                unreadMessages
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== USER MANAGEMENT ====================
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/users/:userId', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/users/:userId/make-admin', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { isAdmin: true },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('Error making admin:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/users/:userId/suspension', verifyAdmin, async (req, res) => {
    try {
        const { suspended } = req.body;

        if (typeof suspended !== 'boolean') {
            return res.status(400).json({ error: 'Suspended status is required' });
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isAdmin && suspended) {
            return res.status(400).json({ error: 'Admin accounts cannot be suspended' });
        }

        user.isSuspended = suspended;
        await user.save();

        const safeUser = user.toJSON();
        res.json({
            success: true,
            message: suspended ? 'User suspended successfully' : 'User unsuspended successfully',
            user: safeUser
        });
    } catch (err) {
        console.error('Error updating user suspension:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== RESOURCE MANAGEMENT ====================
router.get('/resources', verifyAdmin, async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.json({ success: true, resources });
    } catch (err) {
        console.error('Error fetching resources:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/resources', verifyAdmin, upload.single('file'), async (req, res) => {
    try {
        const { title, author, category, grade_level, resource_type, description, available } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Determine file information if provided
        let fileUrl = '';
        let fileType = 'none';
        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
            const ext = req.file.originalname.split('.').pop().toLowerCase();
            if (ext === 'pdf') fileType = 'pdf';
            else if (['mp4', 'mov', 'mkv', 'avi', 'mpeg'].includes(ext)) fileType = 'video';
            else if (['mp3', 'wav'].includes(ext)) fileType = 'audio';
        }

        const resource = new Resource({
            title,
            author: author || 'Unknown',
            category: category || 'General',
            grade_level: grade_level || 'All grades',
            resource_type: resource_type || 'Book',
            description: description || '',
            available: available !== undefined ? available : true,
            file_url: fileUrl,
            file_type: fileType
        });

        await resource.save();
        res.json({ success: true, message: 'Resource added successfully', resource });
    } catch (err) {
        console.error('Error adding resource:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/resources/:resourceId', verifyAdmin, upload.single('file'), async (req, res) => {
    try {
        const { title, author, category, grade_level, resource_type, description, available } = req.body;
        
        const updateData = {
            title,
            author,
            category,
            grade_level,
            resource_type,
            description,
            available: available !== undefined ? (available === 'true' || available === true) : true
        };

        if (req.file) {
            updateData.file_url = `/uploads/${req.file.filename}`;
            const ext = req.file.originalname.split('.').pop().toLowerCase();
            if (ext === 'pdf') updateData.file_type = 'pdf';
            else if (['mp4', 'mov', 'mkv', 'avi', 'mpeg'].includes(ext)) updateData.file_type = 'video';
            else if (['mp3', 'wav'].includes(ext)) updateData.file_type = 'audio';
        }

        const resource = await Resource.findByIdAndUpdate(
            req.params.resourceId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json({ success: true, message: 'Resource updated successfully', resource });
    } catch (err) {
        console.error('Error updating resource:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/resources/:resourceId', verifyAdmin, async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
        console.error('Error deleting resource:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== MESSAGE MANAGEMENT ====================
router.get('/messages', verifyAdmin, async (req, res) => {
    try {
        const messages = await Feedback.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/messages/:messageId/read', verifyAdmin, async (req, res) => {
    try {
        const message = await Feedback.findByIdAndUpdate(
            req.params.messageId,
            { is_read: true },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json({ success: true, message: 'Message marked as read' });
    } catch (err) {
        console.error('Error updating message:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/messages/:messageId', verifyAdmin, async (req, res) => {
    try {
        const message = await Feedback.findByIdAndDelete(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ANNOUNCEMENT MANAGEMENT ====================
router.get('/announcements', verifyAdmin, async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json({ success: true, announcements });
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/announcements', verifyAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const announcement = new Announcement({
            title: title.trim(),
            content: content.trim()
        });

        await announcement.save();
        res.json({ success: true, message: 'Announcement posted successfully', announcement });
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/announcements/:announcementId', verifyAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const announcement = await Announcement.findByIdAndUpdate(
            req.params.announcementId,
            { title: title.trim(), content: content.trim() },
            { new: true, runValidators: true }
        );

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.json({ success: true, message: 'Announcement updated successfully', announcement });
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/announcements/:announcementId', verifyAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.announcementId);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;