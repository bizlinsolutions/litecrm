import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Check if MONGODB_URI is available
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('📋 Please ensure .env.local exists and contains MONGODB_URI');
  console.log('💡 You can copy .env.example to .env.local and modify it');
  process.exit(1);
}

import dbConnect from '../src/lib/mongodb';
import User from '../src/models/User';
import { hashPassword } from '../src/lib/auth';
import { getRolePermissions } from '../src/lib/permissions';

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await dbConnect();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@litecrm.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    const hashedPassword = await hashPassword(adminPassword);
    const permissions = getRolePermissions('admin');

    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      permissions,
      isActive: true,
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  Please change the admin password after first login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
