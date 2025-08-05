import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { auth } from '@/middleware/auth';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const createTicketSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    status: z.enum(['open', 'in-progress', 'pending', 'resolved', 'closed']).optional().default('open'),
    category: z.string().optional(),
    customerId: z.string().min(1, 'Customer is required'), // Make required
    assignedTo: z.string().optional(),
    relatedInvoices: z.array(z.string()).optional().default([]),
    relatedTickets: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
});

const updateTicketSchema = createTicketSchema.partial();

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

        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TICKET_READ)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status');
        const priority = url.searchParams.get('priority');
        const category = url.searchParams.get('category');
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
        if (category) filter.category = category;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (customerId) filter.customerId = customerId;

        // If user is support role, only show their assigned tickets or unassigned ones
        if (user.role === 'support') {
            filter.$or = [
                { assignedTo: user._id },
                { assignedTo: { $exists: false } },
                { assignedTo: null }
            ];
        }
        // If user is regular user, only show tickets they created
        else if (user.role === 'user') {
            filter.createdBy = user._id;
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate('assignedTo', 'name email')
                .populate('customerId', 'name email')
                .populate('createdBy', 'name email')
                .populate('relatedInvoices', 'invoiceNumber amount status')
                .populate('relatedTickets', 'title status priority')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Ticket.countDocuments(filter)
        ]);

        return Response.json({
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

        const userPermissions = getRolePermissions(user.role);
        if (!hasPermission(userPermissions, PERMISSIONS.TICKET_CREATE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const validatedData = createTicketSchema.parse(body);

        const ticket = new Ticket({
            ...validatedData,
            createdBy: user._id,
            ticketNumber: await generateTicketNumber(),
        });

        await ticket.save();

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber amount status')
            .populate('relatedTickets', 'title status priority');

        return Response.json({ ticket: populatedTicket }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return Response.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 });
        }

        console.error('Ticket creation error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to generate unique ticket numbers
async function generateTicketNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Count tickets created today
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const count = await Ticket.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `TKT-${dateStr}-${sequence}`;
}
