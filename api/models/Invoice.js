const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvoiceItemSchema = new Schema({
    description: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
});

const InvoiceSchema = new Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    items: [InvoiceItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft',
    },
    issuedDate: {
        type: Date,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    paidDate: {
        type: Date,
    },
    notes: {
        type: String,
    },
    billingAddress: {
        name: {
            type: String,
            required: true,
        },
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdBy: 1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
