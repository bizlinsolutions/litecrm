import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { withPermission, AuthenticatedRequest } from '@/middleware/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { triggerWebhooks, WEBHOOK_EVENTS } from '@/lib/webhook';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'prospect', 'lead']).default('prospect'),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// GET /api/customers - List customers with pagination and filtering
export const GET = withPermission(PERMISSIONS.CUSTOMER_READ)(
  async (req: AuthenticatedRequest) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search');
      const status = searchParams.get('status');
      const assignedTo = searchParams.get('assignedTo');

      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (search) {
        query.$text = { $search: search };
      }

      if (status) {
        query.status = status;
      }

      if (assignedTo) {
        query.assignedTo = assignedTo;
      }

      // Execute query with pagination
      const [customers, total] = await Promise.all([
        Customer.find(query)
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Customer.countDocuments(query),
      ]);

      return NextResponse.json({
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// POST /api/customers - Create new customer
export const POST = withPermission(PERMISSIONS.CUSTOMER_CREATE)(
  async (req: AuthenticatedRequest) => {
    try {
      await dbConnect();

      const body = await req.json();
      const validatedData = customerSchema.parse(body);

      // Check if customer with email already exists
      if (validatedData.email) {
        const existingCustomer = await Customer.findOne({
          email: validatedData.email.toLowerCase()
        });

        if (existingCustomer) {
          return NextResponse.json(
            { error: 'Customer with this email already exists' },
            { status: 409 }
          );
        }
      }

      const customer = new Customer({
        ...validatedData,
        email: validatedData.email?.toLowerCase(),
        createdBy: req.user!.userId,
      });

      await customer.save();
      await customer.populate(['assignedTo', 'createdBy'], 'name email');

      // Trigger webhook
      await triggerWebhooks(WEBHOOK_EVENTS.CUSTOMER_CREATED, customer);

      return NextResponse.json({
        message: 'Customer created successfully',
        customer,
      }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Error creating customer:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
