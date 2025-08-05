import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Webhook from '@/models/Webhook';
import { auth } from '@/middleware/auth';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const updateWebhookSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    url: z.string().url('Invalid URL format').optional(),
    events: z.array(z.string()).min(1, 'At least one event is required').optional(),
    headers: z.record(z.string(), z.string()).optional(),
    secret: z.string().optional(),
    retryCount: z.number().min(0).max(10).optional(),
    timeout: z.number().min(1000).max(30000).optional(),
    isActive: z.boolean().optional(),
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
        if (!hasPermission(userPermissions, PERMISSIONS.WEBHOOK_READ)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const webhook = await Webhook.findById(params.id)
            .populate('createdBy', 'name email');

        if (!webhook) {
            return Response.json({ error: 'Webhook not found' }, { status: 404 });
        }

        return Response.json({ webhook });

    } catch (error) {
        console.error('Webhook fetch error:', error);
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
        if (!hasPermission(userPermissions, PERMISSIONS.WEBHOOK_UPDATE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const existingWebhook = await Webhook.findById(params.id);
        if (!existingWebhook) {
            return Response.json({ error: 'Webhook not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = updateWebhookSchema.parse(body);

        // If updating URL or events, check for duplicates
        if (validatedData.url || validatedData.events) {
            const checkUrl = validatedData.url || existingWebhook.url;
            const checkEvents = validatedData.events || existingWebhook.events;

            const duplicateWebhook = await Webhook.findOne({
                _id: { $ne: params.id },
                url: checkUrl,
                events: { $in: checkEvents },
                isActive: true
            });

            if (duplicateWebhook) {
                return Response.json({
                    error: 'A webhook with this URL and events already exists'
                }, { status: 400 });
            }
        }

        const updatedWebhook = await Webhook.findByIdAndUpdate(
            params.id,
            {
                ...validatedData,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('createdBy', 'name email');

        return Response.json({ webhook: updatedWebhook });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return Response.json({
                error: 'Validation failed',
                details: error.issues
            }, { status: 400 });
        }

        console.error('Webhook update error:', error);
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
        if (!hasPermission(userPermissions, PERMISSIONS.WEBHOOK_DELETE)) {
            return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        await connectToDatabase();

        const webhook = await Webhook.findById(params.id);
        if (!webhook) {
            return Response.json({ error: 'Webhook not found' }, { status: 404 });
        }

        await Webhook.findByIdAndDelete(params.id);

        return Response.json({ message: 'Webhook deleted successfully' });

    } catch (error) {
        console.error('Webhook deletion error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Test webhook endpoint
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const webhook = await Webhook.findById(params.id);
        if (!webhook) {
            return Response.json({ error: 'Webhook not found' }, { status: 404 });
        }

        // Send test payload
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook payload',
                webhook_id: webhook._id,
                triggered_by: user._id
            }
        };

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...webhook.headers,
                    ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret })
                },
                body: JSON.stringify(testPayload),
                signal: AbortSignal.timeout(webhook.timeout || 5000)
            });

            const responseText = await response.text();

            return Response.json({
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                response: responseText,
                headers: Object.fromEntries(response.headers.entries())
            });

        } catch (fetchError: any) {
            return Response.json({
                success: false,
                error: fetchError.message,
                type: fetchError.name
            });
        }

    } catch (error) {
        console.error('Webhook test error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
