// Sentry must be initialized before all other imports so it can instrument the app
let Sentry;
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry = await import('@sentry/node');
    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: 'production',
        integrations: [nodeProfilingIntegration()],
        // Capture 10% of transactions for performance monitoring in production
        tracesSampleRate: 0.1,
        profilesSampleRate: 0.1,
    });
}

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';
import MongoStore from 'connect-mongo';
import User from './models/User.js';
import './config/passport.js';
import logger from './utils/logger.js';
import cache from './utils/cache.js';

// Load env vars
dotenv.config();

// SECURITY: Enforce required environment variables at startup
// Fail fast if critical secrets are missing to prevent insecure deployments
const requiredEnvVars = {
    JWT_SECRET: 'Required for signing authentication tokens',
    SESSION_SECRET: 'Required for session encryption',
    MONGODB_URI: 'Required for database connection',
};

const missingVars = [];
const insecureVars = [];

for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
        missingVars.push(`${varName} (${description})`);
    } else if (
        varName === 'SESSION_SECRET' &&
        process.env[varName] === 'development-secret-change-in-production'
    ) {
        insecureVars.push(`${varName} is using the default development value`);
    } else if (varName === 'JWT_SECRET' && process.env[varName].length < 32) {
        insecureVars.push(`${varName} is too short (minimum 32 characters recommended)`);
    }
}

// In production, fail if any required vars are missing or insecure
if (process.env.NODE_ENV === 'production') {
    if (missingVars.length > 0 || insecureVars.length > 0) {
        logger.error('\n❌ FATAL: Cannot start server in production mode\n');
        if (missingVars.length > 0) {
            logger.error('Missing required environment variables:');
            missingVars.forEach((v) => logger.error(`  - ${v}`));
        }
        if (insecureVars.length > 0) {
            logger.error('\nInsecure environment variables:');
            insecureVars.forEach((v) => logger.error(`  - ${v}`));
        }
        logger.error(
            '\nPlease set all required environment variables in your .env file or environment.\n'
        );
        process.exit(1);
    }
} else {
    // In development, show warnings but allow startup
    if (missingVars.length > 0) {
        logger.warn('\n⚠️  WARNING: Missing environment variables (development mode):');
        missingVars.forEach((v) => logger.warn(`  - ${v}`));
        logger.warn('');
    }
    if (insecureVars.length > 0) {
        logger.warn('⚠️  WARNING: Insecure environment variables (development mode):');
        insecureVars.forEach((v) => logger.warn(`  - ${v}`));
        logger.warn('');
    }
}

// Warn about optional OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn(
        '⚠️  WARNING: Google OAuth credentials not configured. Social login will not work.'
    );
}

// SECURITY: Validate additional optional vars in production
if (process.env.NODE_ENV === 'production') {
    const optionalVars = [
        { name: 'CLOUDINARY_CLOUD_NAME', desc: 'Required for image uploads' },
        { name: 'CLOUDINARY_API_KEY', desc: 'Required for image uploads' },
        { name: 'CLOUDINARY_API_SECRET', desc: 'Required for image uploads' },
        { name: 'SMTP_EMAIL', desc: 'Required for email sending (password reset)' },
        { name: 'SMTP_PASSWORD', desc: 'Required for email sending' },
    ];

    for (const v of optionalVars) {
        if (!process.env[v.name]) {
            logger.warn(`⚠️  WARNING: ${v.name} not configured (${v.desc})`);
        }
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 48) {
        logger.warn(
            '⚠️  WARNING: JWT_SECRET is shorter than 48 characters. Consider using a longer secret.'
        );
    }
}

// Import routes
import authRoutes from './routes/authRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import Message from './models/Message.js';

// Import middleware
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/requestLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ─── Allowed Origins (used by both CORS and Socket.io) ──────────────────────
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    'https://' + process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

// Authenticate socket connections via JWT cookie or Authorization header
io.use(async (socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie || '';
        const tokenMatch = cookieHeader.match(/access_token=([^;]+)/);
        const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : socket.handshake.auth?.token;

        if (!token) return next(new Error('Authentication required'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const cacheKey = `socket:user:${decoded.id}`;
        let user = await cache.get(cacheKey);
        
        if (!user) {
            user = await User.findById(decoded.id).select('name role store').lean();
            if (user) await cache.set(cacheKey, user, 60); // Cache for 60 seconds
        }
        
        if (!user) return next(new Error('User not found'));

        socket.user = user;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    const user = socket.user;

    // Each user joins their personal room for targeted notifications
    socket.join(`user:${user._id}`);

    // Sellers join their store room so they receive order events
    if (user.role === 'seller' && user.store) {
        socket.join(`store:${user.store}`);
    }

    // Client requests to join an order room (buyer tracking their order)
    socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
    });

    socket.on('leave:order', (orderId) => {
        socket.leave(`order:${orderId}`);
    });

    // Direct chat: join a conversation room keyed by sorted user IDs
    socket.on('join:chat', (roomId) => {
        socket.join(`chat:${roomId}`);
    });

    socket.on('chat:message', async (payload) => {
        try {
            // Persist to MongoDB
            const saved = await Message.create({
                roomId: payload.roomId,
                sender: user._id,
                text: payload.text,
            });
            const msgOut = {
                _id: saved._id,
                roomId: saved.roomId,
                text: saved.text,
                sender: { _id: user._id, name: user.name },
                createdAt: saved.createdAt.toISOString(),
            };
            // Broadcast to everyone in the room (including sender)
            io.to(`chat:${payload.roomId}`).emit('chat:message', msgOut);
        } catch (_err) {
            socket.emit('chat:error', { message: 'Failed to send message' });
        }
    });

    socket.on('disconnect', () => {});
});

// Attach io to app so controllers can emit events via req.app.get('io')
app.set('io', io);

// Required for express-rate-limit to work correctly behind proxies
app.set('trust proxy', 1);

// CORS must be before all other middleware to ensure headers are present on errors
app.use(
    cors({
        origin: function (origin, callback) {
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                return callback(new Error('CORS policy: origin not allowed'), false);
            }
            return callback(null, true);
        },
        credentials: true,
    })
);

// Enable compression for all responses
app.use(compression());

app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});

app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                // Nonce-based scripts — no more 'unsafe-inline' on scriptSrc (#12)
                scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
                // Styles: 'unsafe-inline' kept only for third-party component libraries
                // that inject styles at runtime. Migrate to hashes when possible.
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'res.cloudinary.com'],
                connectSrc: [
                    "'self'",
                    'https://api.cloudinary.com',
                    'https://res.cloudinary.com',
                ],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

// Request logging - logs method, path, status, duration on every response
app.use(requestLogger);

// XSS protection - sanitizes user input
app.use(xss());

// NoSQL injection prevention - sanitizes data against query selector injection attacks
app.use(mongoSanitize());

// Rate limiting - general API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
});

// Rate limiting - stricter limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
    },
});

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// Cookie parser - required for reading HTTP-only auth cookies
app.use(cookieParser());

// Body parser middleware
// NOTE: Stricter per-route limits can be configured on specific routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request timeout middleware ──────────────────────────────────────────────
// Terminate requests that take longer than REQUEST_TIMEOUT_MS (default: 30s)
// This prevents slow-loris style attacks and hung database queries.
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
app.use((req, res, next) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                message: 'Request timed out. Please try again.',
            });
        }
    }, REQUEST_TIMEOUT_MS);

    // Clear the timeout as soon as the response is finished (success or error)
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
});

// Skip uploads directory creation on serverless platforms (read-only filesystem)
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerless ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!isServerless && !fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info('📁 Created uploads directory');
}

// Static folder for uploads
app.use('/uploads', express.static(uploadsDir));

// Session middleware - hardened configuration with MongoDB store
// The SESSION_SECRET validation is now handled by the env var enforcement above

// Configure session with MongoDB store for production persistence
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // 'none' is required for cross-origin requests (Firebase frontend → Render backend).
        // 'none' REQUIRES secure:true which is enforced above.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
};

// Use MongoDB store in production for session persistence
// This ensures sessions survive server restarts and work across multiple instances
if (process.env.MONGODB_URI) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60, // Session TTL in seconds (24 hours)
        autoRemove: 'native', // Use MongoDB's TTL index for cleanup
        touchAfter: 24 * 3600, // Only update session once per 24 hours unless data changes
        crypto: {
            secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
        },
    });
    logger.info('📦 Using MongoDB session store');
} else {
    logger.warn(
        '⚠️  WARNING: No MONGODB_URI, using in-memory session store (not for production!)'
    );
}

app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB (only when running directly, not when imported for tests)
if (process.env.NODE_ENV !== 'test') {
    mongoose
        .connect(process.env.MONGODB_URI, {
            maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || '10', 10),
            // RELIABILITY: Fail fast when MongoDB is unreachable instead of hanging
            // for the full 30s request timeout, which causes thundering-herd on recovery.
            serverSelectionTimeoutMS: 5000,
            // Close idle sockets after 45 s to avoid stale connection issues.
            socketTimeoutMS: 45000,
        })
        .then(() => logger.info('✅ MongoDB Connected'))
        .catch((err) => {
            logger.error('❌ MongoDB Connection Error:', err.message);
            process.exit(1);
        });
}

// ── API Router ─────────────────────────────────────────────────────────────
// All routes are mounted under both:
//   /api/v1/  — versioned (canonical, new clients should use this)
//   /api/     — legacy alias kept for backward compatibility
const apiV1 = express.Router();

apiV1.use('/auth', authLimiter, authRoutes);
apiV1.use('/stores', storeRoutes);
apiV1.use('/products', productRoutes);
apiV1.use('/orders', orderRoutes);
apiV1.use('/admin', adminRoutes);
apiV1.use('/analytics', analyticsRoutes);
apiV1.use('/users', userRoutes);
apiV1.use('/upload', uploadRoutes);
apiV1.use('/chat', chatRoutes);

// Versioned prefix (canonical)
app.use('/api/v1', apiV1);

// Legacy prefix — same handlers, zero breaking changes for existing clients
app.use('/api', apiV1);

// Swagger API docs (dev only)
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Marketplace API Docs',
    })
);

// Public settings endpoint
app.get('/api/settings', async (req, res) => {
    try {
        const Settings = (await import('./models/Settings.js')).default;
        const settings = await Settings.getSettings();
        res.status(200).json({
            success: true,
            settings: {
                taxRate: settings.taxRate,
                shippingFee: settings.shippingFee,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message,
        });
    }
});

// Health check route — verifies DB connectivity and reports runtime metrics (#19, #38)
// Uptime monitors (e.g., Better Uptime, Render health checks) should hit this endpoint.
app.get('/api/health', async (req, res) => {
    const dbState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const dbStatus = dbStateMap[dbState] ?? 'unknown';
    const dbHealthy = dbState === 1;

    const memoryUsage = process.memoryUsage();
    const payload = {
        success: dbHealthy,
        message: 'Server is running',
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: {
                status: dbStatus,
                healthy: dbHealthy,
            },
        },
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
    };

    res.status(dbHealthy ? 200 : 503).json(payload);
});

// Cloudinary direct upload signature (avoids proxying file through server)
// NOTE: Only cloudName, signature, timestamp, and folder are returned.
// The apiKey is a server-side credential and must NOT be sent to the client. (#8)

app.get('/api/upload/signature', (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return res.status(400).json({
            success: false,
            message: 'Cloudinary not configured',
        });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'marketplace_products';
    const params = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(params).digest('hex');

    // Return only what the browser needs to upload directly — never the apiKey or apiSecret
    res.status(200).json({
        success: true,
        cloudName,
        // apiKey intentionally omitted — use a signed upload preset in Cloudinary
        // dashboard and reference it by name from the frontend if key is required.
        signature,
        timestamp,
        folder,
    });
});

// The frontend is hosted on Firebase Hosting (market-place01.web.app).
// This backend only serves API routes — no static frontend files needed.
// Return a JSON 404 for any unmatched routes so the client gets a clear error.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Sentry error handler must come before our own error handler
if (Sentry) {
    Sentry.setupExpressErrorHandler(app);
}

// Error handler middleware (must be last)
app.use(errorHandler);

// Export app and httpServer for Firebase Functions / tests
export { app, httpServer };
export default app;

// Only listen if run directly (not imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
        logger.info('🔌 Socket.io ready');
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────────
    // Handles SIGTERM (Render, Docker, Kubernetes) and SIGINT (Ctrl-C)
    const shutdown = async (signal) => {
        logger.info(`${signal} received — starting graceful shutdown`);

        // 1. Stop accepting new connections
        httpServer.close(async () => {
            logger.info('HTTP server closed');

            try {
                // 2. Close MongoDB connection
                await mongoose.connection.close();
                logger.info('MongoDB connection closed');

                // 3. Flush Sentry events
                if (Sentry) {
                    await Sentry.close(2000);
                }

                logger.info('Graceful shutdown complete');
                process.exit(0);
            } catch (err) {
                logger.error({ err }, 'Error during shutdown');
                process.exit(1);
            }
        });

        // Force-exit after 15 seconds if shutdown hangs
        setTimeout(() => {
            logger.error('Graceful shutdown timed out — forcing exit');
            process.exit(1);
        }, 15_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Log unhandled promise rejections instead of crashing silently
    process.on('unhandledRejection', (reason) => {
        logger.error({ reason }, 'Unhandled promise rejection');
    });
}
