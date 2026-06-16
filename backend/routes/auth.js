const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

console.log('🔐 Auth routes loaded');

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    console.log('\n📝 Registration attempt:', req.body.email);
    
    try {
        const { name, email, password, confirm_password } = req.body;

        // ---- Validate required fields ----
        if (!name || !email || !password || !confirm_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // ---- Trim inputs ----
        const trimmedName = name.trim();
        const normalizedEmail = email.toLowerCase().trim();

        // ---- Validate name ----
        if (trimmedName.length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        // ---- Validate email format ----
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // ---- Validate password length ----
        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        // ---- Validate passwords match ----
        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // ---- Check for existing user ----
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // ---- Create and save user (unverified initially) ----
        const user = new User({
            name: trimmedName,
            email: normalizedEmail,
            password: password,
            isVerified: false  // User must verify email before logging in
        });
        await user.save();

        console.log(`✅ User created: ${normalizedEmail} (unverified)`);

        // ---- Send success response (no token yet - needs verification) ----
        res.json({
            success: true,
            message: 'Account created successfully. Please verify your email with the OTP sent to your inbox.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isVerified: false
            }
        });

    } catch (err) {
        console.error('Registration error:', err.message || err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    console.log('\n🔑 Login attempt:', req.body.email);
    
    try {
        const { email, password } = req.body;

        // ---- Validate required fields ----
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // ---- Normalize email ----
        const normalizedEmail = email.toLowerCase().trim();

        // ---- Find user ----
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log(`👤 User found: ${user.name}, isVerified: ${user.isVerified}`);

        // ---- Check if email is verified ----
        if (!user.isVerified) {
            console.log('❌ Email not verified');
            return res.status(401).json({ 
                error: 'Please verify your email before logging in. Check your inbox for the verification code.',
                needsVerification: true,
                email: user.email
            });
        }

        // ---- Compare password ----
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // ---- Check if account is suspended ----
        if (user.isSuspended) {
            console.log('❌ Account suspended');
            return res.status(403).json({ error: 'Your account has been suspended. Please contact the library administrator.' });
        }

        // ---- Generate JWT ----
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Login successful');

        // ---- Send success response ----
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                isSuspended: user.isSuspended
            }
        });

    } catch (err) {
        console.error('Login error:', err.message || err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ==================== RESEND VERIFICATION OTP ====================
router.post('/resend-verification', async (req, res) => {
    console.log('\n📧 Resend verification requested for:', req.body.email);
    
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email is already verified. You can login.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in global verification store
        if (!global.verificationOtpStore) {
            global.verificationOtpStore = {};
        }
        global.verificationOtpStore[normalizedEmail] = {
            otp: otp,
            expiresAt: Date.now() + 10 * 60 * 1000
        };

        console.log(`🔐 Generated new OTP for ${normalizedEmail}: ${otp}`);

        // Send email with OTP
        const { sendOTPEmail } = require('../utils/email');
        await sendOTPEmail(normalizedEmail, user.name, otp, 'verify');

        res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
    console.log('\n🔐 Forgot password requested for:', req.body.email);
    
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }
        
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log(`🔐 Generated reset OTP for ${normalizedEmail}: ${otp}`);
        
        // Store OTP in global reset store
        if (!global.resetOtpStore) {
            global.resetOtpStore = {};
        }
        global.resetOtpStore[normalizedEmail] = {
            otp: otp,
            expiresAt: Date.now() + 10 * 60 * 1000
        };
        
        // Send email with OTP
        const { sendOTPEmail } = require('../utils/email');
        await sendOTPEmail(normalizedEmail, user.name, otp, 'reset');
        
        res.json({ success: true, message: 'Reset code sent to your email' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
    console.log('\n🔐 Reset password attempt for:', req.body.email);
    
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Verify OTP
        const record = global.resetOtpStore?.[normalizedEmail];
        
        if (!record) {
            return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
        }
        
        if (Date.now() > record.expiresAt) {
            delete global.resetOtpStore[normalizedEmail];
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }
        
        if (record.otp !== otp) {
            return res.status(400).json({ error: 'Invalid reset code. Please try again.' });
        }
        
        // Update password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await User.findOneAndUpdate(
            { email: normalizedEmail },
            { password: hashedPassword }
        );
        
        console.log(`✅ Password updated for ${normalizedEmail}`);
        
        // Clear OTP
        delete global.resetOtpStore[normalizedEmail];
        
        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ==================== VERIFY SESSION ====================
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({ 
                error: 'Email not verified',
                needsVerification: true,
                email: user.email
            });
        }

        if (user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact the library administrator.' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                isSuspended: user.isSuspended
            }
        });
    } catch (err) {
        console.error('Session verification error:', err.message || err);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// ==================== CHANGE PASSWORD (Authenticated) ====================
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        console.log(`✅ Password changed for user: ${user.email}`);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;