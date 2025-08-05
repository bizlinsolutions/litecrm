const mongoose = require('mongoose');
const { Schema } = mongoose;

const TicketMessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderType: {
        type: String,
        enum: ['user', 'customer'],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    attachments: [{
        type: String,
    }],
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const TicketSchema = new Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    category: {
        type: String,
        required: true,
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    relatedInvoices: [{
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
    }],
    relatedTickets: [{
        type: Schema.Types.ObjectId,
        ref: 'Ticket',
    }],
    messages: [TicketMessageSchema],
    tags: [{
        type: String,
        trim: true,
    }],
    resolution: {
        type: String,
    },
    resolvedDate: {
        type: Date,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    strict: false,
});

TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ customerId: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ subject: 'text', description: 'text' });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
