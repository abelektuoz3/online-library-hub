const express = require('express');
const Resource = require('../models/Resource');
const router = express.Router();

// Get all resources from MongoDB
router.get('/', async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.json(resources);
    } catch (err) {
        console.error('Error fetching resources:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get featured resources (for homepage)
router.get('/featured/limit', async (req, res) => {
    try {
        const resources = await Resource.find({ available: true }).sort({ createdAt: -1 }).limit(6);
        res.json(resources);
    } catch (err) {
        console.error('Error fetching featured resources:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single resource by ID
router.get('/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json(resource);
    } catch (err) {
        console.error('Error fetching resource:', err);
        res.status(500).json({ error: err.message });
    }
});

// Search resources with filters
router.get('/search', async (req, res) => {
    try {
        const { search, category, grade_level, resource_type } = req.query;
        let filter = {};
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } }
            ];
        }
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (grade_level && grade_level !== 'all') {
            filter.grade_level = grade_level;
        }
        if (resource_type && resource_type !== 'all') {
            filter.resource_type = resource_type;
        }
        
        const resources = await Resource.find(filter).sort({ createdAt: -1 });
        res.json(resources);
    } catch (err) {
        console.error('Error searching resources:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;