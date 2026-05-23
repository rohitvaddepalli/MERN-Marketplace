import winston from 'winston';

// Detect serverless environments (Vercel, AWS Lambda, etc.) which have read-only filesystems
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const transports = [];

if (isServerless || process.env.NODE_ENV === 'production') {
    // In serverless/production: use console only (filesystem is read-only on Vercel)
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        })
    );
} else {
    // In local development: write to log files + console
    transports.push(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        })
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'marketplace-backend' },
    transports,
});

export default logger;
