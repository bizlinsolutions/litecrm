const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user', 'support'],
        default: 'user',
    },
    permissions: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    avatar: {
        type: String,
    },
}, {
    timestamps: true,
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
