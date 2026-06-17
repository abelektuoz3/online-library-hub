const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ==================== INITIATE GITHUB AUTH ====================
router.get('/', 
    passport.authenticate('github', { scope: ['user:email'] })
);

// ==================== GITHUB CALLBACK ====================
router.get('/callback',
    passport.authenticate('github', { 
        failureRedirect: `${process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app'}/login?error=github_auth_failed`,
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
            console.error('GitHub callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app'}/login?error=github_auth_failed`);
        }
    }
);

module.exports = router;