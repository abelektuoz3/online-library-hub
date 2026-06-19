const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/email');
const router = express.Router();

// ==================== INITIATE GITHUB AUTH ====================
router.get('/', 
    passport.authenticate('github', { scope: ['user:email'] })
);

// ==================== GITHUB CALLBACK ====================
router.get('/callback',
    passport.authenticate('github', { 
        failureRedirect: `${process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app'}/pages/login?error=github_auth_failed`,
        failureMessage: true
    }),
    async function(req, res) {
        try {
            // Check if user is new (passed from passport strategy)
            const isNewUser = req.user.isNewUser || false;
            const userEmail = req.user.email;
            const userName = req.user.name || 'User';
            
            // Generate OTP for email verification
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store OTP in global store with user info
            if (!global.oauthOtpStore) {
                global.oauthOtpStore = {};
            }
            global.oauthOtpStore[userEmail] = {
                otp: otp,
                expiresAt: Date.now() + 10 * 60 * 1000,
                userId: req.user.id,
                isNewUser: isNewUser
            };
            
            console.log(`🔐 OAuth OTP generated for ${userEmail}: ${otp}`);
            
            // Send OTP email
            const emailSent = await sendOTPEmail(userEmail, userName, otp, 'verify');
            
            if (!emailSent) {
                console.error('Failed to send OTP email');
                return res.redirect(`${process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app'}/pages/login?error=otp_send_failed`);
            }
            
            // Redirect to auth-callback with email
            const frontendUrl = process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app';
            res.redirect(`${frontendUrl}/auth-callback.html?email=${encodeURIComponent(userEmail)}&provider=github&isNew=${isNewUser}`);
            
        } catch (error) {
            console.error('GitHub callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'https://online-library-hub.netlify.app';
            res.redirect(`${frontendUrl}/pages/login?error=github_auth_failed`);
        }
    }
);

module.exports = router;