import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import { withPermission, AuthenticatedRequest } from '@/middleware/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { triggerWebhooks, WEBHOOK_EVENTS } from '@/lib/webhook';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  total: z.number().min(0, 'Total must be non-negative'),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100).default(0),
  currency: z.string().default('USD'),
  dueDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
  billingAddress: z.object({
    name: z.string().min(1, 'Billing name is required'),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

// GET /api/invoices - List invoices with pagination and filtering
export const GET = withPermission(PERMISSIONS.INVOICE_READ)(
  async (req: AuthenticatedRequest) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');
      const customerId = searchParams.get('customerId');

      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (customerId) {
        query.customerId = customerId;
      }

      // Execute query with pagination
      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .populate('customerId', 'name email company')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Invoice.countDocuments(query),
      ]);

      return NextResponse.json({
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// POST /api/invoices - Create new invoice
export const POST = withPermission(PERMISSIONS.INVOICE_CREATE)(
  async (req: AuthenticatedRequest) => {
    try {
      await dbConnect();

      const body = await req.json();
      const validatedData = invoiceSchema.parse(body);

      // Verify customer exists
      const customer = await Customer.findById(validatedData.customerId);
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Calculate totals
      const subtotal = validatedData.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = (subtotal * validatedData.taxRate) / 100;
      const total = subtotal + taxAmount;

      // Generate invoice number
      const invoiceCount = await Invoice.countDocuments();
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

      const invoice = new Invoice({
        invoiceNumber,
        customerId: validatedData.customerId,
        items: validatedData.items,
        subtotal,
        taxRate: validatedData.taxRate,
        taxAmount,
        total,
        currency: validatedData.currency,
        issuedDate: new Date(),
        dueDate: validatedData.dueDate,
        notes: validatedData.notes,
        billingAddress: validatedData.billingAddress || {
          name: customer.name,
          street: customer.address?.street,
          city: customer.address?.city,
          state: customer.address?.state,
          zipCode: customer.address?.zipCode,
          country: customer.address?.country,
        },
        createdBy: req.user!.userId,
      });

      await invoice.save();
      await invoice.populate(['customerId', 'createdBy'], 'name email');

      // Trigger webhook
      await triggerWebhooks(WEBHOOK_EVENTS.INVOICE_CREATED, invoice);

      return NextResponse.json({
        message: 'Invoice created successfully',
        invoice,
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Error creating invoice:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
