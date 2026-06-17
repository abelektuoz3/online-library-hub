const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ==================== INITIATE GOOGLE AUTH ====================
router.get('/', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ==================== GOOGLE CALLBACK ====================
router.get('/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app'}/login?error=google_auth_failed`,
        failureMessage: true
    }),
    function(req, res) {
        try {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: req.user.id, 
                    email: req.user.email, 
                    role: req.user.role || 'user' 
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to frontend with token
            const frontendUrl = process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app';
            res.redirect(`${frontendUrl}/auth-success?token=${token}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app'}/login?error=google_auth_failed`);
        }
    }
);

module.exports = router;