import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'adminpassword123', // The model will hash this
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        });

        console.log('✅ Admin user created successfully');
        console.log('📧 Email: admin@example.com');
        console.log('🔑 Password: adminpassword123');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
