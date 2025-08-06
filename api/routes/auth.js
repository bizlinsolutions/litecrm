const express = require('express');
const router = express.Router();
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../lib/mongodb');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } = require('../lib/auth');
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

        // Generate JWT token and refresh token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        });

        const refreshToken = generateRefreshToken({
            userId: user._id.toString(),
        });

        // Store refresh token in database
        await User.findByIdAndUpdate(user._id, {
            $push: {
                refreshTokens: {
                    token: refreshToken,
                    createdAt: new Date(),
                }
            },
            lastLogin: new Date()
        });

        res.json({
            message: 'Login successful',
            token,
            refreshToken,
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

        // Generate JWT token and refresh token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        });

        const refreshToken = generateRefreshToken({
            userId: user._id.toString(),
        });

        // Store refresh token in database
        await User.findByIdAndUpdate(user._id, {
            $push: {
                refreshTokens: {
                    token: refreshToken,
                    createdAt: new Date(),
                }
            }
        });

        res.status(201).json({
            message: 'Registration successful',
            token,
            refreshToken,
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

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        await connectToDatabase();

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Find user and validate refresh token
        const user = await User.findOne({
            _id: decoded.userId,
            'refreshTokens.token': refreshToken,
            'refreshTokens.expiresAt': { $gt: new Date() }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Generate new access token
        const newToken = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        });

        res.json({
            token: newToken,
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
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res) => {
    try {
        await connectToDatabase();

        const { refreshToken } = req.body;
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header required' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        if (refreshToken) {
            // Remove specific refresh token
            await User.findByIdAndUpdate(decoded.userId, {
                $pull: {
                    refreshTokens: { token: refreshToken }
                }
            });
        } else {
            // Remove all refresh tokens (logout from all devices)
            await User.findByIdAndUpdate(decoded.userId, {
                $set: {
                    refreshTokens: []
                }
            });
        }

        res.json({ message: 'Logout successful' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
