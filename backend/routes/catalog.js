const express = require('express');
const Resource = require('../models/Resource');
const router = express.Router();

// Get all resources
router.get('/', async (req, res) => {
    try {
        const { search, category, grade_level, resource_type } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
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

        const resources = await Resource.find(filter);
        res.json(resources);
    } catch (err) {
        console.error('Error fetching catalog:', err);
        res.status(500).json({ error: 'Server error while fetching catalog' });
    }
});

// Get featured resources (for homepage)
router.get('/featured/limit', async (req, res) => {
    try {
        const resources = await Resource.find().limit(6);
        res.json(resources);
    } catch (err) {
        console.error('Error fetching featured resources:', err);
        res.status(500).json({ error: 'Server error while fetching featured resources' });
    }
});

// Get single resource by ID
router.get('/:id', async (req, res) => {
    try {
        // If ID is not a valid ObjectId, return 404
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json(resource);
    } catch (err) {
        console.error('Error fetching resource details:', err);
        res.status(500).json({ error: 'Server error while fetching resource details' });
    }
});

module.exports = router;