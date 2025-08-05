import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhook extends Document {
  _id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastTriggered?: Date;
  failureCount: number;
  maxRetries: number;
  retryDelay: number;
  headers?: Record<string, string>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
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

export default mongoose.models.Webhook || mongoose.model<IWebhook>('Webhook', WebhookSchema);
