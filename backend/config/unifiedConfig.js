import dotenv from 'dotenv';
dotenv.config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    db: {
        uri: process.env.MONGODB_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d',
    },
    session: {
        secret: process.env.SESSION_SECRET,
    },
    sentry: {
        dsn: process.env.SENTRY_DSN,
    },
    redis: {
        url: process.env.REDIS_URL,
    },
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        email: process.env.SMTP_EMAIL,
        password: process.env.SMTP_PASSWORD,
        fromName: process.env.FROM_NAME || 'Marketplace',
        fromEmail: process.env.FROM_EMAIL,
    },
    frontendUrl: process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
};

export default config;
