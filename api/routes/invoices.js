const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../lib/permissions');

const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0, 'Quantity must be non-negative'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    total: z.number().min(0, 'Total must be non-negative'),
});

const createInvoiceSchema = z.object({
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

const updateInvoiceSchema = createInvoiceSchema.partial();

// GET /api/invoices
router.get('/', auth, requirePermission(PERMISSIONS.INVOICE_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;
        const customerId = req.query.customerId;

        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.status = status;
        if (customerId) filter.customerId = customerId;

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate('customerId', 'name email company')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Invoice.countDocuments(filter)
        ]);

        res.json({
            invoices,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Invoices fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/invoices
router.post('/', auth, requirePermission(PERMISSIONS.INVOICE_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = createInvoiceSchema.parse(req.body);

        // Verify customer exists
        const customer = await Customer.findById(validatedData.customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
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
            createdBy: req.user._id,
        });

        await invoice.save();

        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customerId', 'name email company')
            .populate('createdBy', 'name email');

        res.status(201).json({ invoice: populatedInvoice });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Invoice creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/invoices/:id
router.get('/:id', auth, requirePermission(PERMISSIONS.INVOICE_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const invoice = await Invoice.findById(req.params.id)
            .populate('customerId', 'name email company')
            .populate('createdBy', 'name email');

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({ invoice });

    } catch (error) {
        console.error('Invoice fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/invoices/:id
router.put('/:id', auth, requirePermission(PERMISSIONS.INVOICE_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const existingInvoice = await Invoice.findById(req.params.id);
        if (!existingInvoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Check if invoice can be updated (not paid or cancelled)
        if (['paid', 'cancelled'].includes(existingInvoice.status)) {
            return res.status(400).json({ error: 'Cannot update paid or cancelled invoices' });
        }

        const validatedData = updateInvoiceSchema.parse(req.body);

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
            req.params.id,
            { ...validatedData, updatedAt: new Date() },
            { new: true }
        ).populate('customerId', 'name email company')
            .populate('createdBy', 'name email');

        res.json({ invoice: updatedInvoice });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Invoice update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/invoices/:id
router.delete('/:id', auth, requirePermission(PERMISSIONS.INVOICE_DELETE), async (req, res) => {
    try {
        await connectToDatabase();

        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Only allow deletion of draft invoices
        if (invoice.status !== 'draft') {
            return res.status(400).json({ error: 'Only draft invoices can be deleted' });
        }

        await Invoice.findByIdAndDelete(req.params.id);

        res.json({ message: 'Invoice deleted successfully' });

    } catch (error) {
        console.error('Invoice deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
