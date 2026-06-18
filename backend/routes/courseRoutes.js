const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { authenticateAdmin } = require('../middleware/auth');

// ==================== GET ALL COURSES (Public) ====================
router.get('/', async (req, res) => {
    try {
        const { subject, grade, search, page = 1, limit = 50 } = req.query;

        let query = {};

        if (subject && subject !== 'all') {
            query.subject = subject;
        }

        if (grade && grade !== 'all') {
            query.grade = parseInt(grade);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [courses, total] = await Promise.all([
            Course.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Course.countDocuments(query),
        ]);

        // Get unique subjects for filter
        const subjects = await Course.distinct('subject');
        const grades = await Course.distinct('grade');

        res.json({
            success: true,
            courses: courses.map((course) => ({
                id: course._id,
                title: course.title,
                subject: course.subject,
                grade: course.grade,
                description: course.description,
                thumbnail: course.thumbnail || '',
                category: course.category || '',
                totalLessons: course.totalLessons || 0,
                icon: course.icon || 'fa-book',
                color: course.color || 'from-blue-500 to-cyan-500',
                price: course.price || 0,
                published: course.published || false,
                modules: course.modules || [],
                mediaFiles: course.mediaFiles || [],
                createdAt: course.createdAt,
            })),
            filters: {
                subjects: subjects,
                grades: grades.sort((a, b) => a - b),
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: error.message,
        });
    }
});

// ==================== GET SINGLE COURSE ====================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID',
            });
        }

        const course = await Course.findById(id).populate('mediaFiles').lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.json({
            success: true,
            course: {
                id: course._id,
                title: course.title,
                subject: course.subject,
                grade: course.grade,
                description: course.description,
                thumbnail: course.thumbnail || '',
                category: course.category || '',
                totalLessons: course.totalLessons || 0,
                icon: course.icon || 'fa-book',
                color: course.color || 'from-blue-500 to-cyan-500',
                price: course.price || 0,
                published: course.published || false,
                modules: course.modules || [],
                mediaFiles: course.mediaFiles || [],
                createdAt: course.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course',
            error: error.message,
        });
    }
});

// ==================== CREATE COURSE (Admin Only) ====================
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            thumbnail,
            category,
            grade,
            subject,
            price,
            published,
            mediaFiles,
            modules,
            totalLessons,
            color,
            icon,
        } = req.body;

        if (!title || !description || !grade || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, grade, and subject are required',
            });
        }

        const allowedSubjects = ['math', 'physics', 'chemistry', 'biology', 'english', 'amharic', 'history', 'geography', 'cs'];
        const normalizedSubject = allowedSubjects.includes(subject) ? subject : 'cs';
        const normalizedGrade = Number.isInteger(grade) && grade >= 9 && grade <= 12 ? grade : 9;

        const course = new Course({
            title,
            description,
            thumbnail: thumbnail || '',
            category: category || '',
            subject: normalizedSubject,
            grade: normalizedGrade,
            price: Math.max(Number(price) || 0, 0),
            published: !!published,
            mediaFiles: Array.isArray(mediaFiles) ? mediaFiles : [],
            modules: Array.isArray(modules) ? modules : [],
            totalLessons: Number(totalLessons) || 0,
            color: color || 'from-blue-500 to-cyan-500',
            icon: icon || 'fa-book',
        });

        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course: {
                id: course._id,
                title: course.title,
                description: course.description,
                thumbnail: course.thumbnail,
                category: course.category,
                subject: course.subject,
                grade: course.grade,
                price: course.price,
                published: course.published,
                totalLessons: course.totalLessons,
                color: course.color,
                icon: course.icon,
            },
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message,
        });
    }
});

// ==================== UPDATE COURSE (Admin Only) ====================
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID',
            });
        }

        const updates = { ...req.body, updatedAt: new Date() };
        
        if (updates.price !== undefined) {
            updates.price = Math.max(Number(updates.price) || 0, 0);
        }
        if (updates.subject) {
            const allowedSubjects = ['math', 'physics', 'chemistry', 'biology', 'english', 'amharic', 'history', 'geography', 'cs'];
            if (!allowedSubjects.includes(updates.subject)) {
                updates.subject = 'cs';
            }
        }
        if (updates.grade !== undefined) {
            const parsedGrade = Number(updates.grade);
            updates.grade = parsedGrade >= 9 && parsedGrade <= 12 ? parsedGrade : 9;
        }

        const updatedCourse = await Course.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.json({
            success: true,
            message: 'Course updated successfully',
            course: {
                id: updatedCourse._id,
                title: updatedCourse.title,
                description: updatedCourse.description,
                thumbnail: updatedCourse.thumbnail || '',
                category: updatedCourse.category || '',
                subject: updatedCourse.subject,
                grade: updatedCourse.grade,
                price: Number(updatedCourse.price || 0),
                published: !!updatedCourse.published,
                totalLessons: updatedCourse.totalLessons || 0,
                color: updatedCourse.color,
                icon: updatedCourse.icon,
            },
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message,
        });
    }
});

// ==================== DELETE COURSE (Admin Only) ====================
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID',
            });
        }

        const deletedCourse = await Course.findByIdAndDelete(id);

        if (!deletedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.json({
            success: true,
            message: 'Course deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message,
        });
    }
});

// ==================== TOGGLE PUBLISH STATUS ====================
router.patch('/:id/publish', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID',
            });
        }

        if (typeof published !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Published (boolean) is required',
            });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { published, updatedAt: new Date() },
            { new: true }
        ).select('title published');

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.json({
            success: true,
            message: `Course ${published ? 'published' : 'unpublished'} successfully`,
            course: {
                id: updatedCourse._id,
                title: updatedCourse.title,
                published: updatedCourse.published,
            },
        });
    } catch (error) {
        console.error('Error toggling publish status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle publish status',
            error: error.message,
        });
    }
});

module.exports = router;