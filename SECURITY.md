# Security Implementation Guide

## Overview

This document outlines the security measures implemented in the Marketplace application to protect against common web application vulnerabilities.

---

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Authorization Controls](#authorization-controls)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [Session Security](#session-security)
6. [HTTP Security Headers](#http-security-headers)
7. [CORS Configuration](#cors-configuration)
8. [Data Protection](#data-protection)
9. [Environment Configuration](#environment-configuration)
10. [Security Checklist](#security-checklist)

---

## Authentication Security

### HTTP-Only Cookie Authentication

**Location:** `backend/controllers/authController.js`, `backend/middleware/auth.js`

Tokens are now stored in HTTP-only cookies instead of localStorage:

```javascript
// Cookie options
{
    httpOnly: true,      // Prevents XSS attacks - JS cannot access
    secure: true,        // HTTPS only in production
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

**Benefits:**
- XSS attacks cannot steal tokens
- Tokens are automatically sent with requests
- Server-side logout clears credentials

### Password Security

- Passwords are hashed using bcrypt (12 salt rounds)
- Password reset tokens are hashed before storage
- Reset tokens expire after 10 minutes

### Social Login Security

**Location:** `backend/controllers/authController.js`

- OAuth tokens use URL fragments (`#authenticated=true`) instead of query params
- Query params are visible in browser history and server logs
- Fragments are never sent to the server

---

## Authorization Controls

### Role-Based Access Control

**Location:** `backend/middleware/auth.js`

```javascript
authorize('admin')     // Admin only
authorize('seller')    // Seller only
authorize('customer')  // Customer only
authorize('admin', 'seller')  // Admin or Seller
```

### Protected Endpoints

| Endpoint | Required Role |
|----------|---------------|
| `GET /api/orders` (all orders) | Admin only |
| `PUT /api/admin/*` | Admin only |
| `POST /api/products` | Seller only |
| `GET /api/orders/seller/orders` | Seller only |
| `GET /api/orders/myorders` | Customer only |

### Registration Security

**Location:** `backend/controllers/authController.js`

- Role is **always** set to `'customer'` server-side
- User-provided `role` in registration payload is ignored
- Role elevation requires admin action via protected routes

---

## Input Validation & Sanitization

### NoSQL Injection Prevention

**Location:** `backend/server.js`

```javascript
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());
```

Sanitizes input against query selector injection (e.g., `{"$gt": ""}`)

### XSS Protection

**Location:** `backend/server.js`

```javascript
import xss from 'xss-clean';
app.use(xss());
```

Sanitizes user input in request body, params, and query strings.

### Regex DoS (ReDoS) Prevention

**Location:** `backend/controllers/productController.js`

```javascript
// Escape special regex characters
const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Limit and sanitize search input
const sanitizeSearchInput = (input) => {
    const trimmed = input.trim().slice(0, 100);  // Max 100 chars
    return escapeRegex(trimmed);
};
```

### Mass Assignment Prevention

**Location:** `backend/controllers/storeController.js`, `backend/controllers/productController.js`

Only whitelisted fields can be updated:

```javascript
// Store - allowed fields
['name', 'description', 'category', 'address', 'contact', 'logo', 'banner']

// Product - allowed fields
['name', 'description', 'price', 'compareAtPrice', 'stock', 'lowStockThreshold',
 'category', 'subcategory', 'brand', 'images', 'specifications', 'variants',
 'tags', 'isActive', 'sku', 'weight', 'dimensions']
```

**Protected fields:** `owner`, `seller`, `store`, `rating`, `reviewCount`, `createdAt`

---

## Rate Limiting

**Location:** `backend/server.js`

### General API Rate Limit
```javascript
{
    windowMs: 15 * 60 * 1000,  // 15 minutes
    limit: 1000                // 1000 requests per window
}
```

### Auth Routes Rate Limit (Stricter)
```javascript
{
    windowMs: 15 * 60 * 1000,  // 15 minutes
    limit: 100                 // 100 requests per window
}
```

Applied to `/api/auth/*` to prevent brute-force attacks.

---

## Session Security

**Location:** `backend/server.js`

### MongoDB Session Store

Sessions are stored in MongoDB for:
- Persistence across server restarts
- Scalability across multiple server instances
- Automatic cleanup via TTL indexes

```javascript
MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60,        // 24 hours
    autoRemove: 'native',     // Use MongoDB TTL
    crypto: { secret: '...' } // Encrypt session data
})
```

### Secure Cookie Configuration

```javascript
{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
}
```

---

## HTTP Security Headers

**Location:** `backend/server.js`

Using `helmet` middleware:

```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", process.env.FRONTEND_URL]
        }
    },
    crossOriginEmbedderPolicy: false
}));
```

### Headers Set by Helmet

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevent MIME sniffing |
| `X-Frame-Options: SAMEORIGIN` | Prevent clickjacking |
| `X-XSS-Protection: 0` | Rely on CSP instead |
| `Content-Security-Policy` | Restrict resource loading |
| `Strict-Transport-Security` | Force HTTPS |

---

## CORS Configuration

**Location:** `backend/server.js`

```javascript
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);  // Allow no-origin (mobile/curl)
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS not allowed'), false);
    },
    credentials: true  // Allow cookies
}));
```

---

## Data Protection

### Sensitive Fields Hidden by Default

In User model:
```javascript
password: { type: String, select: false }
```

### Safe User Response

Only safe fields are returned in auth responses:
```javascript
{
    id, name, email, role, avatar, phone, address
}
```

Never returned: `password`, `resetPasswordToken`, `resetPasswordExpire`

---

## Environment Configuration

### Required Environment Variables

```env
# Critical Security Variables
NODE_ENV=production
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRE=7d
SESSION_SECRET=another-strong-random-secret

# Database
MONGODB_URI=mongodb+srv://...

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://your-frontend.com

# Email (for password reset)
SMTP_EMAIL=your-email@example.com
SMTP_PASSWORD=your-email-password
```

### Generating Secure Secrets

```bash
# Generate a secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate a secure SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Security Checklist

### Before Production Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, random `JWT_SECRET` (at least 256 bits)
- [ ] Use strong, random `SESSION_SECRET`
- [ ] Configure `FRONTEND_URL` for proper CORS
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Review and restrict allowed CORS origins
- [ ] Set up MongoDB with authentication
- [ ] Configure proper firewall rules
- [ ] Enable MongoDB access logs
- [ ] Set up application logging/monitoring
- [ ] Review rate limiting thresholds
- [ ] Test authentication flows
- [ ] Verify authorization on all protected routes

### Ongoing Security Practices

- [ ] Keep dependencies updated (`npm audit`)
- [ ] Monitor for security vulnerabilities
- [ ] Review access logs regularly
- [ ] Rotate secrets periodically
- [ ] Back up database regularly
- [ ] Test password reset flow
- [ ] Verify email configuration

---

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly by contacting the development team directly rather than opening a public issue.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-09 | 1.0.0 | Initial security implementation |

---

*This document should be updated whenever security-related changes are made to the application.*
