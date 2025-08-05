import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { withPermission, AuthenticatedRequest } from '@/middleware/auth';
import { PERMISSIONS } from '@/lib/permissions';

const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0, 'Quantity must be non-negative'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    total: z.number().min(0, 'Total must be non-negative'),
});

const updateInvoiceSchema = z.object({
    customerId: z.string().optional(),
    items: z.array(invoiceItemSchema).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    currency: z.string().optional(),
    dueDate: z.string().transform((str) => new Date(str)).optional(),
    notes: z.string().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    billingAddress: z.object({
        name: z.string().min(1, 'Billing name is required'),
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
}).partial();

interface RouteParams {
    params: { id: string };
}

// GET /api/invoices/[id] - Get specific invoice
export const GET = withPermission(PERMISSIONS.INVOICE_READ)(
    async (req: AuthenticatedRequest, { params }: RouteParams) => {
        try {
            await dbConnect();
            const { id } = await params;

            const invoice = await Invoice.findById(id)
                .populate('customerId', 'name email company')
                .populate('createdBy', 'name email');

            if (!invoice) {
                return NextResponse.json(
                    { error: 'Invoice not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ invoice });
        } catch (error) {
            console.error('Invoice fetch error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    }
);

// PUT /api/invoices/[id] - Update invoice
export const PUT = withPermission(PERMISSIONS.INVOICE_UPDATE)(
    async (req: AuthenticatedRequest, { params }: RouteParams) => {
        try {
            await dbConnect();
            const { id } = await params;

            const existingInvoice = await Invoice.findById(id);
            if (!existingInvoice) {
                return NextResponse.json(
                    { error: 'Invoice not found' },
                    { status: 404 }
                );
            }

            // Check if invoice can be updated (not paid or cancelled)
            if (['paid', 'cancelled'].includes(existingInvoice.status)) {
                return NextResponse.json(
                    { error: 'Cannot update paid or cancelled invoices' },
                    { status: 400 }
                );
            }

            const body = await req.json();
            const validatedData = updateInvoiceSchema.parse(body);

            // Recalculate totals if items are provided
            if (validatedData.items) {
                const subtotal = validatedData.items.reduce((sum, item) => sum + item.total, 0);
                const taxAmount = subtotal * ((validatedData.taxRate || existingInvoice.taxRate) / 100);
                const total = subtotal + taxAmount;

                Object.assign(validatedData, {
                    subtotal,
                    taxAmount,
                    total
                });
            }

            const updatedInvoice = await Invoice.findByIdAndUpdate(
                id,
                {
                    ...validatedData,
                    updatedAt: new Date()
                },
                { new: true }
            ).populate('customerId', 'name email company')
                .populate('createdBy', 'name email');

            return NextResponse.json({ invoice: updatedInvoice });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    {
                        error: 'Validation failed',
                        details: error.issues
                    },
                    { status: 400 }
                );
            }

            console.error('Invoice update error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    }
);

// DELETE /api/invoices/[id] - Delete invoice
export const DELETE = withPermission(PERMISSIONS.INVOICE_DELETE)(
    async (req: AuthenticatedRequest, { params }: RouteParams) => {
        try {
            await dbConnect();

            const invoice = await Invoice.findById(params.id);
            if (!invoice) {
                return NextResponse.json(
                    { error: 'Invoice not found' },
                    { status: 404 }
                );
            }

            // Only allow deletion of draft invoices
            if (invoice.status !== 'draft') {
                return NextResponse.json(
                    { error: 'Only draft invoices can be deleted' },
                    { status: 400 }
                );
            }

            await Invoice.findByIdAndDelete(params.id);

            return NextResponse.json({ message: 'Invoice deleted successfully' });

        } catch (error) {
            console.error('Invoice deletion error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    }
);
