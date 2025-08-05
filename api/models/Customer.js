const mongoose = require('mongoose');
const { Schema } = mongoose;

const CustomerSchema = new Schema({
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

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
