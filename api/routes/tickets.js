const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const Ticket = require('../models/Ticket');
const { auth } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../lib/permissions');

const createTicketSchema = z.object({
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    category: z.string().min(1, 'Category is required'),
    customerId: z.string().min(1, 'Customer is required'),
    assignedTo: z.string().optional(),
    relatedInvoices: z.array(z.string()).optional().default([]),
    relatedTickets: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
});

const updateTicketSchema = createTicketSchema.partial();

async function generateTicketNumber() {
    const count = await Ticket.countDocuments();
    return `TKT-${String(count + 1).padStart(6, '0')}`;
}

// GET /api/tickets
router.get('/', auth, requirePermission(PERMISSIONS.TICKET_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;
        const priority = req.query.priority;
        const category = req.query.category;
        const assignedTo = req.query.assignedTo;
        const customerId = req.query.customerId;

        const skip = (page - 1) * limit;

        const filter = {};

        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { ticketNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (customerId) filter.customerId = customerId;

        // Access control based on user role
        if (req.user.role === 'support') {
            filter.$or = [
                { assignedTo: req.user._id },
                { assignedTo: { $exists: false } },
                { assignedTo: null }
            ];
        } else if (req.user.role === 'user') {
            filter.createdBy = req.user._id;
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate('assignedTo', 'name email')
                .populate('customerId', 'name email')
                .populate('createdBy', 'name email')
                .populate('relatedInvoices', 'invoiceNumber total status')
                .populate('relatedTickets', 'ticketNumber subject status priority')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Ticket.countDocuments(filter)
        ]);

        res.json({
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Tickets fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/tickets
router.post('/', auth, requirePermission(PERMISSIONS.TICKET_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = createTicketSchema.parse(req.body);

        const ticket = new Ticket({
            ...validatedData,
            createdBy: req.user._id,
            ticketNumber: await generateTicketNumber(),
        });

        await ticket.save();

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber total status')
            .populate('relatedTickets', 'ticketNumber subject status priority');

        res.status(201).json({ ticket: populatedTicket });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Ticket creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/tickets/:id
router.get('/:id', auth, requirePermission(PERMISSIONS.TICKET_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const ticket = await Ticket.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber total status')
            .populate('relatedTickets', 'ticketNumber subject status priority')
            .populate('messages.sender', 'name email');

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Access control
        if (req.user.role === 'user' && ticket.createdBy?._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (req.user.role === 'support' &&
            ticket.assignedTo?._id.toString() !== req.user._id.toString() &&
            ticket.createdBy?._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        res.json({ ticket });

    } catch (error) {
        console.error('Ticket fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/tickets/:id
router.put('/:id', auth, requirePermission(PERMISSIONS.TICKET_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const existingTicket = await Ticket.findById(req.params.id);
        if (!existingTicket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Access control
        if (req.user.role === 'user' && existingTicket.createdBy?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const validatedData = updateTicketSchema.parse(req.body);

        // If status is being changed to resolved, set resolvedDate
        if (validatedData.status === 'resolved' && existingTicket.status !== 'resolved') {
            validatedData.resolvedDate = new Date();
        }

        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { ...validatedData, updatedAt: new Date() },
            { new: true }
        ).populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber total status')
            .populate('relatedTickets', 'ticketNumber subject status priority');

        res.json({ ticket: updatedTicket });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Ticket update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/tickets/:id
router.delete('/:id', auth, requirePermission(PERMISSIONS.TICKET_DELETE), async (req, res) => {
    try {
        await connectToDatabase();

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Only admin or manager can delete tickets, or the user who created it
        if (!['admin', 'manager'].includes(req.user.role) && ticket.createdBy?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        await Ticket.findByIdAndDelete(req.params.id);

        res.json({ message: 'Ticket deleted successfully' });

    } catch (error) {
        console.error('Ticket deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
