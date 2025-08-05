import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Webhook from '@/models/Webhook';
import { auth } from '@/middleware/auth';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const createWebhookSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('Invalid URL format'),
    events: z.array(z.string()).min(1, 'At least one event is required'),
    headers: z.record(z.string(), z.string()).optional().default({}),
    secret: z.string().optional(),
    retryCount: z.number().min(0).max(10).optional().default(3),
    timeout: z.number().min(1000).max(30000).optional().default(5000),
    isActive: z.boolean().optional().default(true),
});

const updateWebhookSchema = createWebhookSchema.partial();

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
        if (!hasPermission(userPermissions, PERMISSIONS.WEBHOOK_READ)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const isActive = url.searchParams.get('isActive');
        const event = url.searchParams.get('event');

        const skip = (page - 1) * limit;

        // Build filter query
        const filter: any = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { url: { $regex: search, $options: 'i' } }
            ];
        }

        if (isActive !== null && isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        if (event) {
            filter.events = { $in: [event] };
        }

        const [webhooks, total] = await Promise.all([
            Webhook.find(filter)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Webhook.countDocuments(filter)
        ]);

        return Response.json({
            webhooks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Webhooks fetch error:', error);
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
        if (!hasPermission(userPermissions, PERMISSIONS.WEBHOOK_CREATE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const validatedData = createWebhookSchema.parse(body);

        // Check for duplicate webhook URLs for the same events
        const existingWebhook = await Webhook.findOne({
            url: validatedData.url,
            events: { $in: validatedData.events },
            isActive: true
        });

        if (existingWebhook) {
            return Response.json({
                error: 'A webhook with this URL and events already exists'
            }, { status: 400 });
        }

        const webhook = new Webhook({
            ...validatedData,
            createdBy: user._id,
        });

        await webhook.save();

        const populatedWebhook = await Webhook.findById(webhook._id)
            .populate('createdBy', 'name email');

        return Response.json({ webhook: populatedWebhook }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return Response.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 });
        }

        console.error('Webhook creation error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
