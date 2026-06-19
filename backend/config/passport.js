const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    // ==================== GITHUB STRATEGY ====================
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'https://online-library-hub.onrender.com/api/auth/github/callback',
        scope: ['user:email']
    },
    async function(accessToken, refreshToken, profile, done) {
        try {
            console.log('GitHub Profile:', profile);
            
            // Check if user exists by email or githubId
            let user = await User.findOne({ 
                $or: [
                    { githubId: profile.id },
                    { email: profile.emails?.[0]?.value }
                ]
            });

            let isNewUser = false;

            if (!user) {
                // Create new user (Registration)
                isNewUser = true;
                user = new User({
                    githubId: profile.id,
                    name: profile.displayName || profile.username,
                    email: profile.emails?.[0]?.value || `${profile.username}@github.user`,
                    password: Math.random().toString(36).slice(-16),
                    isVerified: true,
                    authProvider: 'github'
                });
                await user.save();
                console.log('✅ New GitHub user created:', user.email);
            } else if (!user.githubId) {
                // Link GitHub account to existing user (Login)
                user.githubId = profile.id;
                user.isVerified = true;
                user.authProvider = 'github';
                await user.save();
                console.log('✅ GitHub linked to existing user:', user.email);
            } else {
                // Existing user logging in
                console.log('✅ Existing GitHub user logged in:', user.email);
            }

            // Attach isNewUser flag to user object for the callback
            user.isNewUser = isNewUser;
            return done(null, user);
        } catch (error) {
            console.error('GitHub auth error:', error);
            return done(error, null);
        }
    }));

    // ==================== GOOGLE STRATEGY ====================
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://online-library-hub.onrender.com/api/auth/google/callback',
        scope: ['profile', 'email']
    },
    async function(accessToken, refreshToken, profile, done) {
        try {
            console.log('Google Profile:', profile);
            
            // Check if user exists by email or googleId
            let user = await User.findOne({ 
                $or: [
                    { googleId: profile.id },
                    { email: profile.emails?.[0]?.value }
                ]
            });

            let isNewUser = false;

            if (!user) {
                // Create new user (Registration)
                isNewUser = true;
                user = new User({
                    googleId: profile.id,
                    name: profile.displayName || profile.name?.givenName || 'User',
                    email: profile.emails?.[0]?.value,
                    password: Math.random().toString(36).slice(-16),
                    isVerified: true,
                    authProvider: 'google'
                });
                await user.save();
                console.log('✅ New Google user created:', user.email);
            } else if (!user.googleId) {
                // Link Google account to existing user (Login)
                user.googleId = profile.id;
                user.isVerified = true;
                user.authProvider = 'google';
                await user.save();
                console.log('✅ Google linked to existing user:', user.email);
            } else {
                // Existing user logging in
                console.log('✅ Existing Google user logged in:', user.email);
            }

            // Attach isNewUser flag to user object for the callback
            user.isNewUser = isNewUser;
            return done(null, user);
        } catch (error) {
            console.error('Google auth error:', error);
            return done(error, null);
        }
    }));

    // ==================== SERIALIZATION ====================
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};