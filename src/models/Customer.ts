import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags: string[];
  status: 'active' | 'inactive' | 'prospect' | 'lead';
  assignedTo?: mongoose.Types.ObjectId;
  notes?: string;
  customFields?: Record<string, any>;
  totalSpent: number;
  lastContactDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'lead'],
    default: 'prospect',
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
  },
  customFields: {
    type: Schema.Types.Mixed,
    default: {},
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  lastContactDate: {
    type: Date,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

CustomerSchema.index({ email: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ assignedTo: 1 });
CustomerSchema.index({ createdBy: 1 });
CustomerSchema.index({ name: 'text', company: 'text', email: 'text' });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
