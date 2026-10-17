process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-testing-12345';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.NODE_ENV = 'test';
process.env.SMTP_EMAIL = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.FRONTEND_URL = 'http://localhost:3000';
// Unit tests mock db/index.js — no database connection is made. DATABASE_URL
// is still set to a dummy so any accidental real query fails loudly instead of
// silently relying on a developer's .env.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/unused_test_db';
