import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketMessage {
  sender: mongoose.Types.ObjectId;
  senderType: 'user' | 'customer';
  message: string;
  attachments?: string[];
  timestamp: Date;
}

export interface ITicket extends Document {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  customerId: mongoose.Types.ObjectId; // Required: Link to customer
  assignedTo?: mongoose.Types.ObjectId;
  relatedInvoices?: mongoose.Types.ObjectId[]; // Optional: Link to related invoices
  relatedTickets?: mongoose.Types.ObjectId[]; // Optional: Link to related tickets
  messages: ITicketMessage[];
  tags: string[];
  resolution?: string;
  resolvedDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType',
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

const TicketSchema = new Schema<ITicket>({
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
    default: 'general',
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true, // Make customer required for tickets
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
  strict: false, // Allow additional fields for flexibility
});

TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ customerId: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ subject: 'text', description: 'text' });

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
