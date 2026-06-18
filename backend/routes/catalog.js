const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Course = require('../models/Course');

// GET all resources (books + courses)
router.get('/', async (req, res) => {
    try {
        console.log('📚 Fetching catalog resources...');
        
        // Get books and courses
        const [books, courses] = await Promise.all([
            Book.find().sort({ createdAt: -1 }).lean(),
            Course.find().sort({ createdAt: -1 }).lean()
        ]);

        console.log(`📚 Found ${books.length} books and ${courses.length} courses`);

        // Combine and format resources
        const resources = [
            ...books.map(b => ({
                id: b._id,
                title: b.title,
                description: b.description || 'No description available',
                category: b.category || 'General',
                grade_level: b.grade_level || 'All Levels',
                resource_type: b.resource_type || 'Book',
                available: b.available !== false,
                author: b.author || 'Unknown',
                coverImage: b.coverImage || '',
                fileUrl: b.fileUrl || '',
                price: b.price || 0,
                resourceType: 'book',
                displayType: '📚 Book',
                createdAt: b.createdAt
            })),
            ...courses.map(c => ({
                id: c._id,
                title: c.title,
                description: c.description || 'No description available',
                category: c.category || c.subject || 'General',
                grade_level: `Grade ${c.grade || 'N/A'}`,
                resource_type: 'Course',
                available: c.published !== false,
                author: 'Admin',
                coverImage: c.thumbnail || '',
                fileUrl: c.mediaFiles?.length > 0 ? '/uploads/media' : '',
                price: c.price || 0,
                resourceType: 'course',
                displayType: '🎓 Course',
                totalLessons: c.totalLessons || 0,
                createdAt: c.createdAt
            }))
        ];

        // Sort by createdAt (newest first)
        resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ 
            success: true, 
            resources: resources,
            total: resources.length,
            books: books.length,
            courses: courses.length
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

// GET single resource by ID (checks both collections)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid resource ID format'
            });
        }

        // Try to find in Books first
        let resource = await Book.findById(id).lean();
        let resourceType = 'book';
        
        // If not found, try Courses
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

        // Format response based on type
        let formattedResource;
        if (resourceType === 'book') {
            formattedResource = {
                id: resource._id,
                title: resource.title,
                description: resource.description || 'No description available',
                category: resource.category || 'General',
                grade_level: resource.grade_level || 'All Levels',
                resource_type: resource.resource_type || 'Book',
                available: resource.available !== false,
                author: resource.author || 'Unknown',
                coverImage: resource.coverImage || '',
                fileUrl: resource.fileUrl || '',
                price: resource.price || 0,
                resourceType: 'book',
                createdAt: resource.createdAt
            };
        } else {
            formattedResource = {
                id: resource._id,
                title: resource.title,
                description: resource.description || 'No description available',
                category: resource.category || resource.subject || 'General',
                grade_level: `Grade ${resource.grade || 'N/A'}`,
                resource_type: 'Course',
                available: resource.published !== false,
                author: 'Admin',
                coverImage: resource.thumbnail || '',
                fileUrl: resource.mediaFiles?.length > 0 ? '/uploads/media' : '',
                price: resource.price || 0,
                resourceType: 'course',
                totalLessons: resource.totalLessons || 0,
                createdAt: resource.createdAt
            };
        }

        res.json({ 
            success: true, 
            resource: formattedResource,
            resourceType: resourceType
        });
    } catch (error) {
        console.error('❌ Error fetching resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resource',
            details: error.message
        });
    }
});

module.exports = router;