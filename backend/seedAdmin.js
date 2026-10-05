import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('⚠️ Admin user already exists');
            process.exit();
        }

        // SECURITY: Generate a cryptographically random temporary password that is never logged.
        // The admin must use the "Forgot Password" flow to securely set their initial password.
        const tempPassword = crypto.randomBytes(32).toString('hex');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

        await User.create({
            name: 'Admin User',
            email: adminEmail,
            password: tempPassword, // bcrypt pre-save hook hashes this
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        });

        // Do not log the password to prevent credential leakage.
        // Direct the operator to a verified password-change path (Forgot Password).
        console.log('\n✅ Admin user created successfully');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  📧 Email   : ${adminEmail}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  ⚠️  IMPORTANT: For security, no password has been provided.');
        console.log('     Please use the "Forgot Password" feature on the login');
        console.log('     screen to securely set your initial admin password.\n');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
