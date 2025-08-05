import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId; // Required: Link to customer
  relatedInvoices?: mongoose.Types.ObjectId[]; // Optional: Link to related invoices
  relatedTickets?: mongoose.Types.ObjectId[]; // Optional: Link to related tickets
  dueDate?: Date;
  completedDate?: Date;
  tags: string[];
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
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
    enum: ['todo', 'in-progress', 'completed', 'cancelled'],
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
    required: true, // Make customer required for tasks
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
  strict: false, // Allow additional fields for flexibility
});

TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ customerId: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
