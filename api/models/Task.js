const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled'],
        default: 'todo',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    relatedInvoices: [{
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
    }],
    relatedTickets: [{
        type: Schema.Types.ObjectId,
        ref: 'Ticket',
    }],
    dueDate: {
        type: Date,
    },
    completedDate: {
        type: Date,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    attachments: [{
        type: String,
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    strict: false,
});

TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ customerId: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
