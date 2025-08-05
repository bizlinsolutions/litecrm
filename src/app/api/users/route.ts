import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withPermission, AuthenticatedRequest } from '@/middleware/auth';
import { PERMISSIONS, getRolePermissions } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';

const userSchema = z.object({
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
});

// GET /api/users - List users with pagination and filtering
export const GET = withPermission(PERMISSIONS.USER_READ)(
    async (req: AuthenticatedRequest) => {
        try {
            await dbConnect();

            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '10');
            const search = searchParams.get('search') || '';
            const role = searchParams.get('role') || '';
            const status = searchParams.get('status') || '';

            const skip = (page - 1) * limit;

            // Build query
            const query: any = {};

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }

            if (role) {
                query.role = role;
            }

            if (status) {
                query.isActive = status === 'active';
            }

            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(query),
            ]);

            return NextResponse.json({
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            );
        }
    }
);

// POST /api/users - Create new user
export const POST = withPermission(PERMISSIONS.USER_CREATE)(
    async (req: AuthenticatedRequest) => {
        try {
            await dbConnect();

            const body = await req.json();
            const validatedData = userSchema.parse(body);

            // Check if user already exists
            const existingUser = await User.findOne({ email: validatedData.email });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'User with this email already exists' },
                    { status: 409 }
                );
            }

            // Hash password
            const hashedPassword = await hashPassword(validatedData.password);

            // Get permissions for the role
            const permissions = getRolePermissions(validatedData.role);

            // Create new user
            const user = new User({
                ...validatedData,
                password: hashedPassword,
                permissions,
            });

            await user.save();

            // Return user without password
            const { password, ...userWithoutPassword } = user.toObject();

            return NextResponse.json(
                { message: 'User created successfully', user: userWithoutPassword },
                { status: 201 }
            );
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    { error: 'Validation failed', details: error.issues },
                    { status: 400 }
                );
            }

            console.error('Error creating user:', error);
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }
    }
);
