const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Book = require('../models/Book');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const upload = require('../config/multer');

// ==================== ADMIN LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
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

// ==================== VERIFY TOKEN ====================
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

// ==================== RESOURCE ROUTES (Books + Courses) ====================

// GET all resources (both books and courses)
router.get('/resources', authMiddleware, async (req, res) => {
    try {
        console.log('📚 Fetching all resources...');
        
        const [books, courses] = await Promise.all([
            Book.find().sort({ createdAt: -1 }).lean(),
            Course.find().sort({ createdAt: -1 }).lean()
        ]);

        console.log(`📚 Found ${books.length} books and ${courses.length} courses`);

        const resources = [
            ...books.map(b => ({
                ...b,
                resourceType: 'book',
                type: 'Book',
                grade_level: b.grade_level || 'N/A',
                category: b.category || 'General',
                displayType: '📚 Book'
            })),
            ...courses.map(c => ({
                ...c,
                resourceType: 'course',
                type: 'Course',
                grade_level: `Grade ${c.grade || 'N/A'}`,
                category: c.category || c.subject || 'General',
                title: c.title,
                description: c.description,
                available: c.published !== false,
                displayType: '🎓 Course',
                author: 'Admin',
                price: c.price || 0
            }))
        ];

        resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ success: true, resources });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch resources' 
        });
    }
});

// GET single resource
router.get('/resources/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid resource ID format'
            });
        }

        let resource = await Book.findById(id).lean();
        let resourceType = 'book';
        
        if (!resource) {
            resource = await Course.findById(id).lean();
            resourceType = 'course';
        }

        if (!resource) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }

        res.json({ success: true, resource, resourceType });
    } catch (error) {
        console.error('Error fetching resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resource'
        });
    }
});

// POST new resource (Book or Course)
router.post('/resources', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        console.log('📝 Creating new resource...');
        console.log('Request body:', req.body);
        console.log('File:', req.file);

        const { 
            title, 
            category, 
            grade_level, 
            resource_type, 
            description,
            available,
            resourceType
        } = req.body;

        // Validate required fields
        if (!title || !category || !grade_level || !resource_type) {
            return res.status(400).json({
                success: false,
                error: 'Title, category, grade level, and resource type are required'
            });
        }

        let fileUrl = '';
        let coverImage = '';
        
        if (req.file) {
            console.log('📎 File uploaded:', req.file.originalname);
            const baseUrl = process.env.API_BASE || 'https://online-library-hub.onrender.com';
            fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
            coverImage = `${baseUrl}/uploads/${req.file.filename}`;
        }

        let newResource;
        const isCourse = resourceType === 'course';

        if (isCourse) {
            console.log('🎓 Creating a COURSE...');
            
            const subjectMap = {
                'Mathematics': 'math',
                'Programming': 'cs',
                'History': 'history',
                'Science': 'science',
                'English': 'english',
                'Arts': 'arts',
                'Technology': 'cs',
                'Fiction': 'english',
                'Non-Fiction': 'english',
                'Other': 'cs'
            };

            let gradeNum = 9;
            if (grade_level) {
                const match = grade_level.match(/\d+/);
                if (match) {
                    gradeNum = parseInt(match[0]);
                    if (gradeNum < 9) gradeNum = 9;
                    if (gradeNum > 12) gradeNum = 12;
                }
            }

            const subject = subjectMap[category] || 'cs';

            newResource = new Course({
                title: title.trim(),
                description: description || 'No description provided',
                thumbnail: coverImage || '',
                category: category || 'General',
                subject: subject,
                grade: gradeNum,
                price: 0,
                published: available === 'true' || available === true,
                color: 'from-blue-500 to-cyan-500',
                icon: 'fa-graduation-cap',
                modules: [],
                totalLessons: 0,
                mediaFiles: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await newResource.save();
            console.log('✅ Course created successfully:', newResource._id);
            
        } else {
            console.log('📚 Creating a BOOK...');
            
            newResource = new Book({
                title: title.trim(),
                author: 'Admin Upload',
                description: description || 'No description provided',
                category: category || 'Other',
                grade_level: grade_level || 'Other',
                resource_type: resource_type || 'Book',
                available: available === 'true' || available === true,
                coverImage: coverImage || 'https://via.placeholder.com/300x400?text=No+Cover',
                fileUrl: fileUrl || '',
                price: 0,
                pages: null,
                publisher: 'Online Library Hub',
                publicationYear: new Date().getFullYear(),
                language: 'English',
                isbn: '',
                featured: false,
                uploadedBy: req.admin._id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await newResource.save();
            console.log('✅ Book created successfully:', newResource._id);
        }

        res.status(201).json({
            success: true,
            message: 'Resource created successfully',
            resource: newResource,
            resourceType: isCourse ? 'course' : 'book'
        });

    } catch (error) {
        console.error('❌ Error creating resource:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create resource',
            details: error.message
        });
    }
});

// DELETE resource (Book or Course)
router.delete('/resources/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting resource with ID:', id);
        
        if (!id || id === 'undefined' || id === 'null' || id === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid resource ID provided' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid resource ID format' 
            });
        }

        let deleted = await Book.findByIdAndDelete(id);
        let deletedType = 'book';
        
        if (!deleted) {
            deleted = await Course.findByIdAndDelete(id);
            deletedType = 'course';
        }

        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                error: 'Resource not found' 
            });
        }

        console.log(`✅ ${deletedType} deleted successfully:`, id);
        res.json({ 
            success: true, 
            message: 'Resource deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete resource' 
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
        console.log('🗑️ Deleting user with ID:', id);
        
        if (!id || id === 'undefined' || id === 'null' || id === '') {
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

        console.log('✅ User deleted successfully:', id);
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

// Make user admin
router.put('/users/:id/make-admin', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role: 'admin' },
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
            message: 'User promoted to admin successfully',
            user
        });
    } catch (error) {
        console.error('Error making admin:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to make user admin'
        });
    }
});

// Toggle user suspension
router.put('/users/:id/suspension', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { suspended } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isSuspended: suspended },
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
            message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
            user
        });
    } catch (error) {
        console.error('Error toggling suspension:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle user suspension'
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

// POST new announcement
router.post('/announcements', authMiddleware, async (req, res) => {
    try {
        const { title, content, type, isActive, expiresAt } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content are required'
            });
        }

        const newAnnouncement = new Announcement({
            title: title.trim(),
            content: content.trim(),
            type: type || 'info',
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.admin._id,
            expiresAt: expiresAt || null
        });

        await newAnnouncement.save();

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement: newAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create announcement'
        });
    }
});

// DELETE announcement
router.delete('/announcements/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting announcement with ID:', id);
        
        if (!id || id === 'undefined' || id === 'null' || id === '') {
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

        console.log('✅ Announcement deleted successfully:', id);
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

// ==================== MESSAGE ROUTES ====================

// GET all messages
router.get('/messages', authMiddleware, async (req, res) => {
    try {
        const Contact = require('../models/Contact');
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Mark message as read
router.put('/messages/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const Contact = require('../models/Contact');

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid message ID format'
            });
        }

        const message = await Contact.findByIdAndUpdate(
            id,
            { is_read: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message marked as read',
            data: message
        });
    } catch (error) {
        console.error('Error marking message read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark message as read'
        });
    }
});

// DELETE message
router.delete('/messages/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const Contact = require('../models/Contact');
        
        console.log('🗑️ Deleting message with ID:', id);
        
        if (!id || id === 'undefined' || id === 'null' || id === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid message ID' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid message ID format' 
            });
        }

        const message = await Contact.findByIdAndDelete(id);
        
        if (!message) {
            return res.status(404).json({ 
                success: false, 
                error: 'Message not found' 
            });
        }

        console.log('✅ Message deleted successfully:', id);
        res.json({ 
            success: true, 
            message: 'Message deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete message' 
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
        const totalCourses = await Course.countDocuments();
        const totalAnnouncements = await Announcement.countDocuments();
        const Contact = require('../models/Contact');
        const unreadMessages = await Contact.countDocuments({ is_read: false });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalAdmins,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
                totalResources: totalBooks + totalCourses,
                totalBooks,
                totalCourses,
                totalAnnouncements,
                unreadMessages,
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;