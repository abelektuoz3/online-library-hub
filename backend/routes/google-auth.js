const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const router = express.Router();

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// In-memory store for OAuth pending verification
global.oauthPendingStore = global.oauthPendingStore || {};

// ==================== ROUTE 1: Redirect to Google Login Page ====================
router.get('/auth/google', (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['email', 'profile'],
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

// ==================== ROUTE 2: Google OAuth Callback ====================
router.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('http://localhost:5000/login.html?error=no_code');
    }
    
    try {
        const { tokens } = await googleClient.getToken(code);
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { email, name, sub: googleId, picture } = payload;
        
        console.log(`🔐 Google OAuth callback received for: ${email}`);
        
        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            // EXISTING USER - Login directly (no OTP needed)
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
                console.log(`🔗 Google linked to existing user: ${email}`);
            }
            
            // Create JWT token
            const authToken = jwt.sign(
                { id: user._id, email: user.email, role: user.isAdmin ? 'admin' : 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Redirect directly to dashboard
            const redirectUrl = `http://localhost:5000/auth-callback.html?token=${authToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user._id}&provider=google`;
            return res.redirect(redirectUrl);
            
        } else {
            // NEW USER - Need OTP verification first
            console.log(`🆕 New user via Google: ${email} - Requiring OTP verification`);
            
            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store pending user data with OTP
            global.oauthPendingStore[email] = {
                name: name || email.split('@')[0],
                email: email.toLowerCase(),
                googleId: googleId,
                otp: otp,
                expiresAt: Date.now() + 10 * 60 * 1000,
                provider: 'google'
            };
            
            // Send OTP email
            await sendOTPEmail(email, name || 'User', otp, 'verify');
            
            // Redirect to OTP verification page
            const redirectUrl = `http://localhost:5000/oauth-verify.html?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || email.split('@')[0])}&provider=google`;
            return res.redirect(redirectUrl);
        }
        
    } catch (error) {
        console.error('❌ Google OAuth error:', error);
        res.redirect('http://localhost:5000/login.html?error=google_auth_failed');
    }
});

// ==================== ROUTE 3: Verify OTP for OAuth Signup ====================
router.post('/api/oauth/verify', async (req, res) => {
    const { email, otp, provider } = req.body;
    
    console.log(`🔐 Verifying OTP for OAuth signup: ${email} (${provider})`);
    
    try {
        const pendingData = global.oauthPendingStore[email];
        
        if (!pendingData) {
            return res.status(400).json({ error: 'No pending signup found. Please try signing in again.' });
        }
        
        if (Date.now() > pendingData.expiresAt) {
            delete global.oauthPendingStore[email];
            return res.status(400).json({ error: 'OTP has expired. Please try signing in again.' });
        }
        
        if (pendingData.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }
        
        // Check if user already exists BEFORE creating
        let user = await User.findOne({ email: pendingData.email });
        
        if (user) {
            // User already exists - just update with OAuth ID
            if (provider === 'google' && pendingData.googleId && !user.googleId) {
                user.googleId = pendingData.googleId;
                await user.save();
                console.log(`🔗 Google linked to existing user: ${email}`);
            } else if (provider === 'github' && pendingData.githubId && !user.githubId) {
                user.githubId = pendingData.githubId;
                await user.save();
                console.log(`🔗 GitHub linked to existing user: ${email}`);
            }
        } else {
            // Create new user
            const userData = {
                name: pendingData.name,
                email: pendingData.email,
                isVerified: true,
                password: null
            };
            
            if (provider === 'google' && pendingData.googleId) {
                userData.googleId = pendingData.googleId;
            } else if (provider === 'github' && pendingData.githubId) {
                userData.githubId = pendingData.githubId;
            }
            
            user = new User(userData);
            await user.save();
            console.log(`✅ New user created after OTP verification: ${email}`);
        }
        
        // Clear pending data
        delete global.oauthPendingStore[email];
        
        // Create JWT token
        const authToken = jwt.sign(
            { id: user._id, email: user.email, role: user.isAdmin ? 'admin' : 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('❌ OAuth OTP verify error:', error);
        
        if (error.code === 11000) {
            res.status(400).json({ error: 'This email is already registered. Please try logging in.' });
        } else {
            res.status(500).json({ error: 'Server error. Please try again.' });
        }
    }
});

module.exports = router;