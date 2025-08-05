import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { auth } from '@/middleware/auth';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const updateTicketSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['open', 'in-progress', 'pending', 'resolved', 'closed']).optional(),
    category: z.string().optional(),
    assignedTo: z.string().optional(),
    customerId: z.string().optional(),
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
        if (!hasPermission(userPermissions, PERMISSIONS.TICKET_READ)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const ticket = await Ticket.findById(params.id)
            .populate('assignedTo', 'name email')
            .populate('customerId', 'name email')
            .populate('createdBy', 'name email')
            .populate('relatedInvoices', 'invoiceNumber amount status')
            .populate('relatedTickets', 'title status priority');

        if (!ticket) {
            return Response.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Access control: users can only see tickets they created, support can see assigned tickets, admin/manager can see all
        if (user.role === 'user' && ticket.createdBy?._id.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        if (user.role === 'support' &&
            ticket.assignedTo?._id.toString() !== user._id &&
            ticket.createdBy?._id.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        return Response.json({ ticket });

    } catch (error) {
        console.error('Ticket fetch error:', error);
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
        if (!hasPermission(userPermissions, PERMISSIONS.TICKET_UPDATE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const existingTicket = await Ticket.findById(params.id);
        if (!existingTicket) {
            return Response.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Access control: users can only update tickets they created, support can update assigned tickets, admin/manager can update all
        if (user.role === 'user' && existingTicket.createdBy?.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        if (user.role === 'support' &&
            existingTicket.assignedTo?.toString() !== user._id &&
            existingTicket.createdBy?.toString() !== user._id) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = updateTicketSchema.parse(body);

        const updatedTicket = await Ticket.findByIdAndUpdate(
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
            .populate('relatedTickets', 'title status priority');

        return Response.json({ ticket: updatedTicket });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return Response.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 });
        }

        console.error('Ticket update error:', error);
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
        if (!hasPermission(userPermissions, PERMISSIONS.TICKET_DELETE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const ticket = await Ticket.findById(params.id);
        if (!ticket) {
            return Response.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Only admin or manager can delete tickets
        if (!['admin', 'manager'].includes(user.role)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await Ticket.findByIdAndDelete(params.id);

        return Response.json({ message: 'Ticket deleted successfully' });

    } catch (error) {
        console.error('Ticket deletion error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
