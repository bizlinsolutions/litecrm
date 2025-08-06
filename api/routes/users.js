const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { requirePermission, PERMISSIONS, getRolePermissions } = require('../lib/permissions');
const { hashPassword } = require('../lib/auth');

const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'manager', 'user', 'support']).default('user'),
    isActive: z.boolean().default(true),
    avatar: z.string().optional(),
});

const updateUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.enum(['admin', 'manager', 'user', 'support']).optional(),
    isActive: z.boolean().optional(),
    avatar: z.string().optional(),
}).partial();

// GET /api/users/me - Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        await connectToDatabase();

        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });

    } catch (error) {
        console.error('User profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users
router.get('/', auth, requirePermission(PERMISSIONS.USER_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role;
        const isActive = req.query.isActive;

        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users
router.post('/', auth, requirePermission(PERMISSIONS.USER_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = createUserSchema.parse(req.body);

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

        const user = new User({
            ...validatedData,
            email: validatedData.email.toLowerCase(),
            password: hashedPassword,
            permissions,
        });

        await user.save();

        // Return user without password
        const newUser = await User.findById(user._id).select('-password');

        res.status(201).json({ user: newUser });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('User creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/:id
router.get('/:id', auth, requirePermission(PERMISSIONS.USER_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id
router.put('/:id', auth, requirePermission(PERMISSIONS.USER_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = updateUserSchema.parse(req.body);

        // If password is being updated, hash it
        if (validatedData.password) {
            validatedData.password = await hashPassword(validatedData.password);
        }

        // If role is being updated, update permissions
        if (validatedData.role) {
            validatedData.permissions = getRolePermissions(validatedData.role);
        }

        // If email is being updated, check for duplicates
        if (validatedData.email) {
            const existingUser = await User.findOne({
                email: validatedData.email.toLowerCase(),
                _id: { $ne: req.params.id }
            });

            if (existingUser) {
                return res.status(409).json({ error: 'Email already in use' });
            }

            validatedData.email = validatedData.email.toLowerCase();
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { ...validatedData, updatedAt: new Date() },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: updatedUser });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('User update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', auth, requirePermission(PERMISSIONS.USER_DELETE), async (req, res) => {
    try {
        await connectToDatabase();

        // Prevent deleting own account
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
