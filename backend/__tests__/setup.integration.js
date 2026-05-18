import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-testing-12345';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.NODE_ENV = 'test';
process.env.SMTP_EMAIL = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.FRONTEND_URL = 'http://localhost:3000';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
}, 300000);

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});
