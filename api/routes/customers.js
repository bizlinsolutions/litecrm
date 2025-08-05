const express = require('express');
const router = express.Router();
const { z } = require('zod');
const connectToDatabase = require('../lib/mongodb');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../lib/permissions');

const createCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
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
    tags: z.array(z.string()).optional().default([]),
    status: z.enum(['active', 'inactive', 'prospect', 'lead']).optional().default('prospect'),
    notes: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET /api/customers - Get all customers
router.get('/', auth, requirePermission(PERMISSIONS.CUSTOMER_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;

        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.status = status;

        const [customers, total] = await Promise.all([
            Customer.find(filter)
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Customer.countDocuments(filter)
        ]);

        res.json({
            customers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Customers fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/customers - Create new customer
router.post('/', auth, requirePermission(PERMISSIONS.CUSTOMER_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = createCustomerSchema.parse(req.body);

        const customer = new Customer({
            ...validatedData,
            createdBy: req.user._id,
        });

        await customer.save();

        const populatedCustomer = await Customer.findById(customer._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        res.status(201).json({ customer: populatedCustomer });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Customer creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/customers/:id - Get specific customer
router.get('/:id', auth, requirePermission(PERMISSIONS.CUSTOMER_READ), async (req, res) => {
    try {
        await connectToDatabase();

        const customer = await Customer.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer });

    } catch (error) {
        console.error('Customer fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', auth, requirePermission(PERMISSIONS.CUSTOMER_WRITE), async (req, res) => {
    try {
        await connectToDatabase();

        const validatedData = updateCustomerSchema.parse(req.body);

        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            { ...validatedData, updatedAt: new Date() },
            { new: true }
        ).populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!updatedCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer: updatedCustomer });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }

        console.error('Customer update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', auth, requirePermission(PERMISSIONS.CUSTOMER_DELETE), async (req, res) => {
    try {
        await connectToDatabase();

        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });

    } catch (error) {
        console.error('Customer deletion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
