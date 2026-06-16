const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();

// Submit contact message
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        const feedback = new Feedback({
            name,
            email,
            message
        });

        await feedback.save();

        res.json({
            success: true,
            message: 'Message sent successfully! Thank you for your feedback.'
        });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Server error while sending message' });
    }
});

// Get all messages (admin)
router.get('/all', async (req, res) => {
    try {
        const messages = await Feedback.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        console.error('Error fetching feedback messages:', err);
        res.status(500).json({ error: 'Server error while fetching feedback messages' });
    }
});

module.exports = router;