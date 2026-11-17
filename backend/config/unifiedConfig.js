import dotenv from 'dotenv';
dotenv.config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    sentry: {
        dsn: process.env.SENTRY_DSN,
    },
    redis: {
        url: process.env.REDIS_URL,
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
    isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
};

export default config;
