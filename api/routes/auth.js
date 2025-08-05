const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../lib/auth');
const { getRolePermissions } = require('../lib/permissions');

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'manager', 'user', 'support']).default('user'),
});

// POST /api/auth/login - User authentication
router.post('/login', async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = loginSchema.parse(req.body);

        // Find user by email
        const user = await User.findOne({
            email: validatedData.email.toLowerCase(),
            isActive: true
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await comparePassword(validatedData.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        // Generate JWT token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = registerSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await User.findOne({
            email: validatedData.email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);

        // Get role permissions
        const permissions = getRolePermissions(validatedData.role);

        // Create user
        const user = new User({
            name: validatedData.name,
            email: validatedData.email.toLowerCase(),
            password: hashedPassword,
            role: validatedData.role,
            permissions,
        });

        await user.save();

        // Generate JWT token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
