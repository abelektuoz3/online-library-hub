const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const router = express.Router();

// In-memory store for OAuth pending verification
global.oauthPendingStore = global.oauthPendingStore || {};

// ==================== ROUTE 1: Redirect to GitHub Login Page ====================
router.get('/auth/github', (req, res) => {
    const githubAuthUrl = 'https://github.com/login/oauth/authorize';
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    const authUrl = `${githubAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user%20user:email`;
    
    res.redirect(authUrl);
});

// ==================== ROUTE 2: GitHub OAuth Callback ====================
router.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('http://localhost:5000/login.html?error=github_no_code');
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI
            },
            { headers: { Accept: 'application/json' } }
        );
        
        const accessToken = tokenResponse.data.access_token;
        
        if (!accessToken) {
            throw new Error('No access token received');
        }
        
        // Get user profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        // Get user email
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const githubUser = userResponse.data;
        const emails = emailResponse.data;
        const primaryEmail = emails.find(e => e.primary === true) || emails[0];
        const email = primaryEmail ? primaryEmail.email : null;
        
        if (!email) {
            throw new Error('No email found for GitHub user');
        }
        
        const githubId = githubUser.id.toString();
        const name = githubUser.name || githubUser.login;
        
        console.log(`🔐 GitHub OAuth callback received for: ${email}`);
        
        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            // EXISTING USER - Login directly
            if (!user.githubId) {
                user.githubId = githubId;
                await user.save();
                console.log(`🔗 GitHub linked to existing user: ${email}`);
            }
            
            const authToken = jwt.sign(
                { id: user._id, email: user.email, role: user.isAdmin ? 'admin' : 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            const redirectUrl = `http://localhost:5000/auth-callback.html?token=${authToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user._id}&provider=github`;
            return res.redirect(redirectUrl);
            
        } else {
            // NEW USER - Need OTP verification
            console.log(`🆕 New user via GitHub: ${email} - Requiring OTP verification`);
            
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            global.oauthPendingStore[email] = {
                name: name,
                email: email.toLowerCase(),
                githubId: githubId,
                otp: otp,
                expiresAt: Date.now() + 10 * 60 * 1000,
                provider: 'github'
            };
            
            await sendOTPEmail(email, name, otp, 'verify');
            
            const redirectUrl = `http://localhost:5000/oauth-verify.html?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&provider=github`;
            return res.redirect(redirectUrl);
        }
        
    } catch (error) {
        console.error('❌ GitHub OAuth error:', error.response?.data || error.message);
        res.redirect('http://localhost:5000/login.html?error=github_auth_failed');
    }
});

// ==================== ROUTE 3: Verify OTP for OAuth Signup (GitHub) ====================
router.post('/api/oauth/verify', async (req, res) => {
    const { email, otp, provider } = req.body;
    
    console.log(`🔐 Verifying OTP for OAuth signup (GitHub): ${email}`);
    
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
        
        // Check if user already exists
        let user = await User.findOne({ email: pendingData.email });
        
        if (user) {
            // User exists - just update with GitHub ID
            if (!user.githubId) {
                user.githubId = pendingData.githubId;
                await user.save();
                console.log(`🔗 GitHub linked to existing user: ${email}`);
            }
        } else {
            // Create new user
            user = new User({
                name: pendingData.name,
                email: pendingData.email,
                githubId: pendingData.githubId,
                isVerified: true,
                password: null
            });
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
        console.error('❌ GitHub OAuth OTP verify error:', error);
        
        if (error.code === 11000) {
            res.status(400).json({ error: 'This email is already registered. Please try logging in.' });
        } else {
            res.status(500).json({ error: 'Server error. Please try again.' });
        }
    }
});

module.exports = router;