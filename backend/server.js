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
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { clerkMiddleware, clerkClient } from '@clerk/express';
import { query, closePool } from './db/index.js';
import { resolveLocalUser } from './middleware/auth.js';
import logger from './utils/logger.js';

// Load env vars
dotenv.config();

// SECURITY: Enforce required environment variables at startup
// Fail fast if critical secrets are missing to prevent insecure deployments
const requiredEnvVars = {
    DATABASE_URL: 'Required for Neon Postgres connection',
    CLERK_SECRET_KEY: 'Required for Clerk authentication (server API key)',
};

const missingVars = [];
const insecureVars = [];

for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
        missingVars.push(`${varName} (${description})`);
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

// Warn about optional integrations that are not configured
const optionalIntegrations = [
    { name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', desc: 'Required by the frontend Clerk SDK' },
    { name: 'RESEND_API_KEY', desc: 'Required for transactional emails (Resend)' },
    { name: 'R2_ENDPOINT', desc: 'Required for image uploads (Cloudflare R2)' },
    { name: 'R2_ACCESS_KEY_ID', desc: 'Required for image uploads (Cloudflare R2)' },
    { name: 'R2_SECRET_ACCESS_KEY', desc: 'Required for image uploads (Cloudflare R2)' },
    { name: 'R2_BUCKET', desc: 'Required for image uploads (Cloudflare R2)' },
    { name: 'R2_PUBLIC_URL', desc: 'Public base URL of the R2 bucket (custom domain or r2.dev)' },
    { name: 'FRONTEND_URL', desc: 'Cloudflare Pages origin allowed by CORS' },
];
for (const v of optionalIntegrations) {
    if (!process.env[v.name]) {
        logger.warn(`⚠️  WARNING: ${v.name} not configured (${v.desc})`);
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

// Import middleware
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();
const httpServer = createServer(app);

// ─── Allowed Origins (used by both CORS and Socket.io) ──────────────────────
// FRONTEND_URL is the Cloudflare Pages production origin; ALLOWED_ORIGINS is a
// comma-separated list for extra environments (staging, custom domains).
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
].filter(Boolean);

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (process.env.NODE_ENV !== 'production') return true;
    if (allowedOrigins.includes(origin)) return true;
    // Cloudflare Pages preview deployments: <hash>.<project>.pages.dev
    if (process.env.ALLOW_PAGES_PREVIEW === 'true' && /^https:\/\/[a-z0-9.-]+\.pages\.dev$/.test(origin)) {
        return true;
    }
    return false;
};

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

// Authenticate socket connections with a Clerk session token obtained by the
// client via `useAuth().getToken()` (no JWT / localStorage secrets anymore).
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));

        const payload = await clerkClient.verifyToken(token);
        if (!payload?.sub) return next(new Error('Invalid token'));

        const profile = await resolveLocalUser(payload.sub);
        if (!profile) return next(new Error('User not found'));

        // Sellers need their store id to join the store room for order events
        let storeId = null;
        if (profile.role === 'seller') {
            const { rows } = await query('SELECT id FROM stores WHERE owner_id = $1', [profile.id]);
            storeId = rows[0]?.id ?? null;
        }

        socket.user = { _id: profile.id, role: profile.role, name: profile.name, store: storeId };
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
            if (!payload?.roomId || typeof payload.text !== 'string' || !payload.text.trim()) {
                return socket.emit('chat:error', { message: 'Invalid message' });
            }
            const text = payload.text.trim().slice(0, 500);
            const roomId = String(payload.roomId).slice(0, 200);

            // Persist to Postgres
            const { rows } = await query(
                `INSERT INTO messages (room_id, sender_id, text)
                 VALUES ($1, $2, $3)
                 RETURNING id, room_id, text, created_at`,
                [roomId, user._id, text]
            );
            const saved = rows[0];
            const msgOut = {
                _id: saved.id,
                roomId: saved.room_id,
                text: saved.text,
                sender: { _id: user._id, name: user.name },
                createdAt: new Date(saved.created_at).toISOString(),
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
            if (!isOriginAllowed(origin)) {
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

const r2PublicHost = (() => {
    try {
        return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).origin : null;
    } catch {
        return null;
    }
})();

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
                imgSrc: ["'self'", 'data:', 'https:', 'blob:', r2PublicHost].filter(Boolean),
                connectSrc: [
                    "'self'",
                    'https://api.clerk.com',
                    'https://*.clerk.accounts.dev',
                    ...(r2PublicHost ? [r2PublicHost] : []),
                    // R2 presigned uploads go direct from the browser to the bucket
                    ...(process.env.R2_ENDPOINT ? [process.env.R2_ENDPOINT] : []),
                ],
                // Clerk OAuth flows (Google sign-in redirect/popups)
                frameSrc: ["'self'", 'https://clerk.accounts.dev', 'https://accounts.google.com'],
                formAction: ["'self'"],
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

// Cookie parser - required by Clerk for its session cookie
app.use(cookieParser());

// Body parser middleware
// NOTE: Stricter per-route limits can be configured on specific routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// ─── Clerk authentication ────────────────────────────────────────────────────
// clerkMiddleware verifies the session (cookie on same-origin, Authorization:
// Bearer <session token> for the cross-origin Cloudflare Pages frontend) and
// makes getAuth(req) available to protect/authorize middleware.
const clerkMw = clerkMiddleware();
app.use((req, res, next) => {
    try {
        clerkMw(req, res, (err) => {
            if (err) {
                logger.warn(`Clerk middleware error: ${err.message}`);
                return next(); // unauthenticated requests still reach protect → 401
            }
            next();
        });
    } catch (err) {
        // Missing configuration (e.g. local dev without Clerk keys) must not
        // crash the server — protect() will reject with 401 instead.
        logger.warn(`Clerk middleware unavailable: ${err.message}`);
        next();
    }
});

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

// SECURITY: Hide full API schema in production to prevent reconnaissance.
if (process.env.NODE_ENV !== 'production') {
    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customSiteTitle: 'Marketplace API Docs',
        })
    );
}

// Public settings endpoint (tax rate / shipping fee for checkout display)
app.get('/api/settings', async (req, res) => {
    try {
        const { rows } = await query(
            `INSERT INTO settings (id) VALUES (true)
             ON CONFLICT (id) DO UPDATE SET id = true
             RETURNING *`
        );
        res.status(200).json({
            success: true,
            settings: {
                taxRate: rows[0].tax_rate,
                shippingFee: rows[0].shipping_fee,
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

// Health check route — verifies DB connectivity and reports basic status
// Uptime monitors (e.g., Better Uptime, Render health checks) should hit this endpoint.
app.get('/api/health', async (req, res) => {
    let dbHealthy = false;
    try {
        await query('SELECT 1');
        dbHealthy = true;
    } catch {
        dbHealthy = false;
    }
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'ok' : 'degraded',
        success: dbHealthy,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Admin-only verbose health check
import { protect, authorize } from './middleware/auth.js';
app.get('/api/admin/health', protect, authorize('admin'), async (req, res) => {
    let dbStatus = 'disconnected';
    let dbHealthy = false;
    try {
        await query('SELECT 1');
        dbStatus = 'connected';
        dbHealthy = true;
    } catch {
        dbStatus = 'error';
    }

    const memoryUsage = process.memoryUsage();
    res.status(dbHealthy ? 200 : 503).json({
        success: dbHealthy,
        message: 'Server is running',
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: {
                provider: 'neon-postgres',
                status: dbStatus,
                healthy: dbHealthy,
            },
            auth: {
                provider: 'clerk',
                status: process.env.CLERK_SECRET_KEY ? 'configured' : 'missing-secret-key',
            },
        },
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
    });
});

// The frontend is hosted on Cloudflare Pages and talks to this API over CORS.
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

// Export app and httpServer for tests and serverless adapters
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
                // 2. Close the Postgres pool
                await closePool();
                logger.info('Postgres pool closed');

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
