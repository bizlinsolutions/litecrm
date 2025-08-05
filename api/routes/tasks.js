const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const { hasPermission, getRolePermissions, PERMISSIONS, requirePermission } = require('../lib/permissions');

const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    status: z.enum(['todo', 'in-progress', 'review', 'completed']).optional().default('todo'),
    assignedTo: z.string().optional(),
    customerId: z.string().min(1, 'Customer is required'),
    relatedInvoices: z.array(z.string()).optional().default([]),
    relatedTickets: z.array(z.string()).optional().default([]),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
});

const updateTaskSchema = createTaskSchema.partial();

// GET /api/tasks - Get all tasks with filtering
router.get('/', auth, requirePermission(PERMISSIONS.TASK_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;
        const priority = req.query.priority;
        const assignedTo = req.query.assignedTo;
        const customerId = req.query.customerId;

        const skip = (page - 1) * limit;

        // Build filter query
        const filter = {};

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
        if (!['admin', 'manager'].includes(req.user.role)) {
            filter.assignedTo = req.user._id;
        }

        const [tasks, total] = await Promise.all([
            Task.find(filter)
                .populate('assignedTo', 'name email')
                .populate('customerId', 'name email')
                .populate('createdBy', 'name email')
                .populate('relatedInvoices', 'invoiceNumber total status')
                .populate('relatedTickets', 'ticketNumber title status priority')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Task.countDocuments(filter)
        ]);

        res.json({
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/tasks - Create new task
router.post('/', auth, requirePermission(PERMISSIONS.TASK_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = createTaskSchema.parse(req.body);

        const task = new Task({
            ...validatedData,
            createdBy: req.user._id,
            // If assignedTo is not provided and user is not admin/manager, assign to self
            assignedTo: validatedData.assignedTo || (!['admin', 'manager'].includes(req.user.role) ? req.user._id : undefined)
        });

        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber total status')
            .populate('relatedTickets', 'ticketNumber title status priority');

        res.status(201).json({ task: populatedTask });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Task creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/tasks/:id - Get specific task
router.get('/:id', auth, requirePermission(PERMISSIONS.TASK_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber total status')
            .populate('relatedTickets', 'ticketNumber title status priority');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // If user is not admin or manager, only allow access to their assigned tasks
        if (!['admin', 'manager'].includes(req.user.role) && task.assignedTo?._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        res.json({ task });

    } catch (error) {
        console.error('Task fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, requirePermission(PERMISSIONS.TASK_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const existingTask = await Task.findById(req.params.id);
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // If user is not admin or manager, only allow updating their assigned tasks
        if (!['admin', 'manager'].includes(req.user.role) && existingTask.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const validatedData = updateTaskSchema.parse(req.body);

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            {
                ...validatedData,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber total status')
            .populate('relatedTickets', 'ticketNumber title status priority');

        res.json({ task: updatedTask });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Task update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', auth, requirePermission(PERMISSIONS.TASK_DELETE), async (req, res) => {
    try {
        await connectToDatabase();

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Only admin or manager can delete tasks, or the user who created it
        if (!['admin', 'manager'].includes(req.user.role) && task.createdBy?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Task deleted successfully' });

    } catch (error) {
        console.error('Task deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
