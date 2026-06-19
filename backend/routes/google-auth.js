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
            // Check if user is new (passed from passport strategy)
            const isNewUser = req.user.isNewUser || false;
            
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

            const frontendUrl = process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app';
            
            // Redirect based on whether user is new or existing
            if (isNewUser) {
                // New user - redirect to auth-success (registration)
                res.redirect(`${frontendUrl}/auth-success.html?token=${token}`);
            } else {
                // Existing user - redirect to auth-callback (login)
                res.redirect(`${frontendUrl}/auth-callback.html?token=${token}`);
            }
        } catch (error) {
            console.error('Google callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app';
            res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
    }
);

module.exports = router;