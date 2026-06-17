const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId && !this.githubId;
        },
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    // OAuth fields
    googleId: {
        type: String,
        sparse: true,
    },
    githubId: {
        type: String,
        sparse: true,
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'github'],
        default: 'local',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving (only if password is provided)
UserSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);