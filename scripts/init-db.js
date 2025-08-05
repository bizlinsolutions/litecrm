const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// MongoDB connection
async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/litecrm';
    await mongoose.connect(uri);
}

// User Schema (simplified)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'user', 'support'], default: 'user' },
    isActive: { type: Boolean, default: true },
    permissions: [String],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function initializeDatabase() {
    try {
        console.log('🔍 Connecting to database...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Check if admin user exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@litecrm.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', adminEmail);
        } else {
            console.log('🔧 Creating admin user...');

            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = await bcrypt.hash(adminPassword, 12);

            const adminUser = new User({
                name: process.env.ADMIN_NAME || 'System Administrator',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isActive: true,
            });

            await adminUser.save();
            console.log('✅ Admin user created:', adminEmail);
        }

        // Create demo users if they don't exist
        const demoUsers = [
            {
                name: 'Manager Demo',
                email: 'manager@litecrm.com',
                password: 'manager123',
                role: 'manager'
            },
            {
                name: 'User Demo',
                email: 'user@litecrm.com',
                password: 'user123',
                role: 'user'
            },
            {
                name: 'Support Demo',
                email: 'support@litecrm.com',
                password: 'support123',
                role: 'support'
            }
        ];

        for (const userData of demoUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                const user = new User({
                    ...userData,
                    password: hashedPassword,
                    isActive: true,
                });
                await user.save();
                console.log('✅ Demo user created:', userData.email);
            } else {
                console.log('✅ Demo user already exists:', userData.email);
            }
        }

        console.log('🎉 Database initialization completed!');
        console.log('');
        console.log('Demo credentials:');
        console.log('Admin: admin@litecrm.com / admin123');
        console.log('Manager: manager@litecrm.com / manager123');
        console.log('User: user@litecrm.com / user123');
        console.log('Support: support@litecrm.com / support123');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

initializeDatabase();
