import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withPermission, AuthenticatedRequest } from '@/middleware/auth';
import { PERMISSIONS, getRolePermissions } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';

const updateUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.enum(['admin', 'manager', 'user', 'support']).optional(),
    isActive: z.boolean().optional(),
    avatar: z.string().optional(),
});

// GET /api/users/[id] - Get user by ID
export const GET = withPermission(PERMISSIONS.USER_READ)(
    async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
        try {
            await dbConnect();

            const user = await User.findById(params.id).select('-password').lean();

            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ user });
        } catch (error) {
            console.error('Error fetching user:', error);
            return NextResponse.json(
                { error: 'Failed to fetch user' },
                { status: 500 }
            );
        }
    }
);

// PUT /api/users/[id] - Update user
export const PUT = withPermission(PERMISSIONS.USER_UPDATE)(
    async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
        try {
            await dbConnect();

            const body = await req.json();
            const validatedData = updateUserSchema.parse(body);

            const existingUser = await User.findById(params.id);
            if (!existingUser) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Check if email is being changed and if it already exists
            if (validatedData.email && validatedData.email !== existingUser.email) {
                const emailExists = await User.findOne({
                    email: validatedData.email,
                    _id: { $ne: params.id }
                });

                if (emailExists) {
                    return NextResponse.json(
                        { error: 'Email already exists' },
                        { status: 409 }
                    );
                }
            }

            // Prepare update data
            const updateData: any = {
                ...validatedData,
                updatedAt: new Date(),
            };

            // Hash password if provided
            if (validatedData.password) {
                updateData.password = await hashPassword(validatedData.password);
            }

            // Update permissions if role is being changed
            if (validatedData.role && validatedData.role !== existingUser.role) {
                updateData.permissions = getRolePermissions(validatedData.role);
            }

            const updatedUser = await User.findByIdAndUpdate(
                params.id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                message: 'User updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    { error: 'Validation failed', details: error.issues },
                    { status: 400 }
                );
            }

            console.error('Error updating user:', error);
            return NextResponse.json(
                { error: 'Failed to update user' },
                { status: 500 }
            );
        }
    }
);

// DELETE /api/users/[id] - Delete user
export const DELETE = withPermission(PERMISSIONS.USER_DELETE)(
    async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
        try {
            await dbConnect();

            // Prevent users from deleting themselves
            if (req.user?.userId === params.id) {
                return NextResponse.json(
                    { error: 'Cannot delete your own account' },
                    { status: 400 }
                );
            }

            const user = await User.findById(params.id);
            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            await User.findByIdAndDelete(params.id);

            return NextResponse.json({
                message: 'User deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            return NextResponse.json(
                { error: 'Failed to delete user' },
                { status: 500 }
            );
        }
    }
);
