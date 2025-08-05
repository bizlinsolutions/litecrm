import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import { auth } from '@/middleware/auth';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const updateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['todo', 'in-progress', 'review', 'completed']).optional(),
    assignedTo: z.string().optional(),
    customerId: z.string().optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
}).partial();

interface RouteParams {
    params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await auth(request);
        if (!authResult.success) {
            return Response.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 401 });
        }

        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TASK_READ)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const task = await Task.findById(params.id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber amount status')
            .populate('relatedTickets', 'subject status priority');

        if (!task) {
            return Response.json({ error: 'Task not found' }, { status: 404 });
        }

        // If user is not admin or manager, only allow access to their assigned tasks
        if (!['admin', 'manager'].includes(user.role) && task.assignedTo?._id.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        return Response.json({ task });

    } catch (error) {
        console.error('Task fetch error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await auth(request);
        if (!authResult.success) {
            return Response.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 401 });
        }

        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TASK_UPDATE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const existingTask = await Task.findById(params.id);
        if (!existingTask) {
            return Response.json({ error: 'Task not found' }, { status: 404 });
        }

        // If user is not admin or manager, only allow updating their assigned tasks
        if (!['admin', 'manager'].includes(user.role) && existingTask.assignedTo?.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = updateTaskSchema.parse(body);

        const updatedTask = await Task.findByIdAndUpdate(
            params.id,
            {
                ...validatedData,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber amount status')
            .populate('relatedTickets', 'subject status priority');

        return Response.json({ task: updatedTask });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return Response.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 });
        }

        console.error('Task update error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await auth(request);
        if (!authResult.success) {
            return Response.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 401 });
        }

        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TASK_DELETE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const task = await Task.findById(params.id);
        if (!task) {
            return Response.json({ error: 'Task not found' }, { status: 404 });
        }

        // Only admin or manager can delete tasks, or the user who created it
        if (!['admin', 'manager'].includes(user.role) && task.createdBy?.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await Task.findByIdAndDelete(params.id);

        return Response.json({ message: 'Task deleted successfully' });

    } catch (error) {
        console.error('Task deletion error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
