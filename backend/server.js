import express from 'express';
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
import './config/passport.js';

// Load env vars
dotenv.config();

// SECURITY: Enforce required environment variables at startup
// Fail fast if critical secrets are missing to prevent insecure deployments
const requiredEnvVars = {
    'JWT_SECRET': 'Required for signing authentication tokens',
    'SESSION_SECRET': 'Required for session encryption',
    'MONGODB_URI': 'Required for database connection'
};

const missingVars = [];
const insecureVars = [];

for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
        missingVars.push(`${varName} (${description})`);
    } else if (varName === 'SESSION_SECRET' && process.env[varName] === 'development-secret-change-in-production') {
        insecureVars.push(`${varName} is using the default development value`);
    } else if (varName === 'JWT_SECRET' && process.env[varName].length < 32) {
        insecureVars.push(`${varName} is too short (minimum 32 characters recommended)`);
    }
}

// In production, fail if any required vars are missing or insecure
if (process.env.NODE_ENV === 'production') {
    if (missingVars.length > 0 || insecureVars.length > 0) {
        console.error('\n❌ FATAL: Cannot start server in production mode\n');
        if (missingVars.length > 0) {
            console.error('Missing required environment variables:');
            missingVars.forEach(v => console.error(`  - ${v}`));
        }
        if (insecureVars.length > 0) {
            console.error('\nInsecure environment variables:');
            insecureVars.forEach(v => console.error(`  - ${v}`));
        }
        console.error('\nPlease set all required environment variables in your .env file or environment.\n');
        process.exit(1);
    }
} else {
    // In development, show warnings but allow startup
    if (missingVars.length > 0) {
        console.warn('\n⚠️  WARNING: Missing environment variables (development mode):');
        missingVars.forEach(v => console.warn(`  - ${v}`));
        console.warn('');
    }
    if (insecureVars.length > 0) {
        console.warn('⚠️  WARNING: Insecure environment variables (development mode):');
        insecureVars.forEach(v => console.warn(`  - ${v}`));
        console.warn('');
    }
}

// Warn about optional OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  WARNING: Google OAuth credentials not configured. Social login will not work.');
}

// Import routes
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';

// Import middleware
import { errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Render/Cloudflare deployment
// Required for express-rate-limit to work correctly behind proxies
app.set('trust proxy', 1);

// Security middleware - Helmet sets various HTTP headers for security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Re-enabling 'unsafe-inline' for styleSrc because many React libraries 
            // (like react-hot-toast and Google Fonts) inject styles dynamically.
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:", "res.cloudinary.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "*"], // Allow connecting to any origin in production to prevent blockers
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// XSS protection - sanitizes user input
app.use(xss());

// NoSQL injection prevention - sanitizes data against query selector injection attacks
app.use(mongoSanitize());

// Rate limiting - general API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

// Rate limiting - stricter limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production, 1000 in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// Cookie parser - required for reading HTTP-only auth cookies
app.use(cookieParser());

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware - Allow requests from frontend
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL, // Manual override
    process.env.RENDER_EXTERNAL_URL, // Automatic Render URL
    'https://' + process.env.RENDER_EXTERNAL_URL // Sometimes Render provides it without https
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// SECURITY: Ensure uploads directory exists
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Static folder for uploads
app.use('/uploads', express.static(uploadsDir));

// Session middleware - hardened configuration with MongoDB store
// The SESSION_SECRET validation is now handled by the env var enforcement above

// Import connect-mongo for production session storage
import MongoStore from 'connect-mongo';

// Configure session with MongoDB store for production persistence
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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
            secret: process.env.SESSION_SECRET || 'development-secret-change-in-production'
        }
    });
    console.log('📦 Using MongoDB session store');
} else {
    console.warn('⚠️  WARNING: No MONGODB_URI, using in-memory session store (not for production!)');
}

app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// Mount routes
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limiting for auth routes
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Public settings endpoint
app.get('/api/settings', async (req, res) => {
    try {
        const Settings = (await import('./models/Settings.js')).default;
        const settings = await Settings.getSettings();
        res.status(200).json({
            success: true,
            settings: {
                taxRate: settings.taxRate,
                shippingFee: settings.shippingFee
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
    });
}

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
