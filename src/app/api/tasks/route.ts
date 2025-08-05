import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import { auth } from '@/middleware/auth';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    status: z.enum(['todo', 'in-progress', 'review', 'completed']).optional().default('todo'),
    assignedTo: z.string().optional(),
    customerId: z.string().min(1, 'Customer is required'), // Make required
    relatedInvoices: z.array(z.string()).optional().default([]),
    relatedTickets: z.array(z.string()).optional().default([]),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
});

const updateTaskSchema = createTaskSchema.partial();

export async function GET(request: NextRequest) {
    try {
        const authResult = await auth(request);
        if (!authResult.success) {
            return Response.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 401 });
        }

        // Check permissions
        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TASK_READ)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status');
        const priority = url.searchParams.get('priority');
        const assignedTo = url.searchParams.get('assignedTo');
        const customerId = url.searchParams.get('customerId');

        const skip = (page - 1) * limit;

        // Build filter query
        const filter: any = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (customerId) filter.customerId = customerId;

        // If user is not admin or manager, only show their assigned tasks
        if (!['admin', 'manager'].includes(user.role)) {
            filter.assignedTo = user._id;
        }

        const [tasks, total] = await Promise.all([
            Task.find(filter)
                .populate('assignedTo', 'name email')
                .populate('customerId', 'name email')
                .populate('createdBy', 'name email')
                .populate('relatedInvoices', 'invoiceNumber amount status')
                .populate('relatedTickets', 'subject status priority')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Task.countDocuments(filter)
        ]);

        return Response.json({
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Tasks fetch error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authResult = await auth(request);
        if (!authResult.success) {
            return Response.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 401 });
        }

        // Check permissions
        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TASK_CREATE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const validatedData = createTaskSchema.parse(body);

        const task = new Task({
            ...validatedData,
            createdBy: user._id,
            // If assignedTo is not provided and user is not admin/manager, assign to self
            assignedTo: validatedData.assignedTo || (!['admin', 'manager'].includes(user.role) ? user._id : undefined)
        });

        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber amount status')
            .populate('relatedTickets', 'subject status priority');

        return Response.json({ task: populatedTask }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return Response.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 });
        }

        console.error('Task creation error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
