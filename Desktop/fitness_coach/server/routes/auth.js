const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Register new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            profile: {
                fitnessLevel: 'beginner',
                goals: [],
                medicalConditions: []
            }
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send response
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        console.log('User found:', { id: user._id, email: user.email });

        // Verify password using the User model method
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send response
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                profile: req.user.profile
            }
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'age', 'gender', 'height', 'weight', 'fitnessLevel', 'goals', 'medicalConditions'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }

        // Update profile
        updates.forEach(update => {
            req.user.profile[update] = req.body[update];
        });

        await req.user.save();

        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                profile: req.user.profile
            }
        });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        req.user.password = newPassword;
        await req.user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        // In a real application, you might want to invalidate the token
        // This would require implementing a token blacklist or using refresh tokens
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 