const express = require('express');
const Announcement = require('../models/Announcement');
const router = express.Router();

// Get all announcements
router.get('/', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ error: 'Server error while fetching announcements' });
    }
});

module.exports = router;
