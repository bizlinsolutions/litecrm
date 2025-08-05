const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const Webhook = require('../models/Webhook');
const { auth } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../lib/permissions');

const createWebhookSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('Invalid URL format'),
    events: z.array(z.string()).min(1, 'At least one event is required'),
    headers: z.record(z.string(), z.string()).optional().default({}),
    secret: z.string().optional(),
    maxRetries: z.number().min(0).max(10).optional().default(3),
    retryDelay: z.number().min(1000).max(30000).optional().default(5000),
    isActive: z.boolean().optional().default(true),
});

const updateWebhookSchema = createWebhookSchema.partial();

// GET /api/webhooks
router.get('/', auth, requirePermission(PERMISSIONS.WEBHOOK_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const isActive = req.query.isActive;
        const event = req.query.event;

        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { url: { $regex: search, $options: 'i' } }
            ];
        }
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (event) filter.events = { $in: [event] };

        const [webhooks, total] = await Promise.all([
            Webhook.find(filter)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Webhook.countDocuments(filter)
        ]);

        res.json({
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/webhooks
router.post('/', auth, requirePermission(PERMISSIONS.WEBHOOK_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = createWebhookSchema.parse(req.body);

        const webhook = new Webhook({
            ...validatedData,
            createdBy: req.user._id,
        });

        await webhook.save();

        const populatedWebhook = await Webhook.findById(webhook._id)
            .populate('createdBy', 'name email');

        res.status(201).json({ webhook: populatedWebhook });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Webhook creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/webhooks/:id
router.get('/:id', auth, requirePermission(PERMISSIONS.WEBHOOK_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const webhook = await Webhook.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.json({ webhook });

    } catch (error) {
        console.error('Webhook fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/webhooks/:id
router.put('/:id', auth, requirePermission(PERMISSIONS.WEBHOOK_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = updateWebhookSchema.parse(req.body);

        const updatedWebhook = await Webhook.findByIdAndUpdate(
            req.params.id,
            { ...validatedData, updatedAt: new Date() },
            { new: true }
        ).populate('createdBy', 'name email');

        if (!updatedWebhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.json({ webhook: updatedWebhook });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Webhook update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/webhooks/:id
router.delete('/:id', auth, requirePermission(PERMISSIONS.WEBHOOK_DELETE), async (req, res) => {
    try {
        await connectToDatabase();

        const webhook = await Webhook.findByIdAndDelete(req.params.id);

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.json({ message: 'Webhook deleted successfully' });

    } catch (error) {
        console.error('Webhook deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
