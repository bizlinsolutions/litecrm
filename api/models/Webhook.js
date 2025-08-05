const mongoose = require('mongoose');
const { Schema } = mongoose;

const WebhookSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'URL must be a valid HTTP or HTTPS URL',
        },
    },
    events: [{
        type: String,
        enum: [
            'customer.created',
            'customer.updated',
            'customer.deleted',
            'invoice.created',
            'invoice.updated',
            'invoice.paid',
            'task.created',
            'task.updated',
            'task.completed',
            'ticket.created',
            'ticket.updated',
            'ticket.resolved',
            'user.created',
            'user.updated',
        ],
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    secret: {
        type: String,
    },
    lastTriggered: {
        type: Date,
    },
    failureCount: {
        type: Number,
        default: 0,
    },
    maxRetries: {
        type: Number,
        default: 3,
    },
    retryDelay: {
        type: Number,
        default: 5000, // 5 seconds
    },
    headers: {
        type: Schema.Types.Mixed,
        default: {},
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

WebhookSchema.index({ isActive: 1 });
WebhookSchema.index({ events: 1 });
WebhookSchema.index({ createdBy: 1 });

module.exports = mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema);
