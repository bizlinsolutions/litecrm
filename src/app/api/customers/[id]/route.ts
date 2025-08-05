import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { withPermission, AuthenticatedRequest } from '@/middleware/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { triggerWebhooks, WEBHOOK_EVENTS } from '@/lib/webhook';

const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
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
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'lead']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// GET /api/customers/[id] - Get customer by ID
export const GET = withPermission(PERMISSIONS.CUSTOMER_READ)(
  async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      await dbConnect();

      const customer = await Customer.findById(params.id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ customer });
    } catch (error) {
      console.error('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// PUT /api/customers/[id] - Update customer
export const PUT = withPermission(PERMISSIONS.CUSTOMER_UPDATE)(
  async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      await dbConnect();

      const body = await req.json();
      const validatedData = updateCustomerSchema.parse(body);

      // Check if email is being updated and if it conflicts
      if (validatedData.email) {
        const existingCustomer = await Customer.findOne({
          email: validatedData.email.toLowerCase(),
          _id: { $ne: params.id },
        });

        if (existingCustomer) {
          return NextResponse.json(
            { error: 'Customer with this email already exists' },
            { status: 409 }
          );
        }
      }

      const customer = await Customer.findByIdAndUpdate(
        params.id,
        {
          ...validatedData,
          email: validatedData.email?.toLowerCase(),
        },
        { new: true, runValidators: true }
      ).populate(['assignedTo', 'createdBy'], 'name email');

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Trigger webhook
      await triggerWebhooks(WEBHOOK_EVENTS.CUSTOMER_UPDATED, customer);

      return NextResponse.json({
        message: 'Customer updated successfully',
        customer,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Error updating customer:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/customers/[id] - Delete customer
export const DELETE = withPermission(PERMISSIONS.CUSTOMER_DELETE)(
  async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      await dbConnect();

      const customer = await Customer.findByIdAndDelete(params.id);

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Trigger webhook
      await triggerWebhooks(WEBHOOK_EVENTS.CUSTOMER_DELETED, {
        id: customer._id,
        name: customer.name,
        email: customer.email,
      });

      return NextResponse.json({
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
