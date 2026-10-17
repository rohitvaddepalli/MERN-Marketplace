/**
 * middleware/auth.js — request authentication for the Express API.
 *
 * Clerk owns credentials: `clerkMiddleware()` (mounted in server.js) verifies
 * the session token, and `protect` turns the verified identity into the local
 * application profile (Postgres `users` row keyed by clerk_user_id) so role
 * checks and ownership comparisons keep working exactly as before.
 *
 * Roles stay in our database (customer/seller/admin) — Clerk authenticates,
 * we authorize.
 */
import { getAuth, clerkClient } from '@clerk/express';
import { query } from '../db/index.js';

/**
 * Resolves a verified Clerk user id to the local profile row.
 * Exported so integration tests can substitute an identity without a live
 * Clerk connection (guarded — cannot be enabled outside NODE_ENV=test).
 */
let authResolver = null;
export const setAuthResolverForTests = (resolver) => {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('setAuthResolverForTests is only available when NODE_ENV=test');
    }
    authResolver = resolver;
};

/**
 * Fetch (or lazily create) the local profile for a Clerk user.
 *
 * First sign-in: pull name/email from Clerk and insert the row. If an
 * existing password-era account has the same email, it is linked to the Clerk
 * identity instead of creating a duplicate (keeps orders/wishlist history).
 */
const resolveLocalUser = async (clerkUserId) => {
    const existing = await query(
        'SELECT id, name, email, role FROM users WHERE clerk_user_id = $1',
        [clerkUserId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    // First authenticated request — build the profile from Clerk's record
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
        throw Object.assign(new Error('Clerk user has no email address'), { statusCode: 401 });
    }
    const name = clerkUser.fullName || clerkUser.firstName || email;

    // Link an existing account with the same email (pre-Clerk data), else insert
    const linked = await query(
        `UPDATE users SET clerk_user_id = $1
         WHERE lower(email) = lower($2) AND clerk_user_id IS NULL
         RETURNING id, name, email, role`,
        [clerkUserId, email]
    );
    if (linked.rows.length > 0) return linked.rows[0];

    const inserted = await query(
        `INSERT INTO users (clerk_user_id, name, email, role)
         VALUES ($1, $2, $3, 'customer')
         ON CONFLICT (clerk_user_id) DO NOTHING
         RETURNING id, name, email, role`,
        [clerkUserId, name, email]
    );
    if (inserted.rows.length > 0) return inserted.rows[0];

    // Lost a race with a concurrent first request — read the winner's row
    const after = await query(
        'SELECT id, name, email, role FROM users WHERE clerk_user_id = $1',
        [clerkUserId]
    );
    return after.rows[0] ?? null;
};

/** Shared: identity → req.user (or null when not authenticated). */
const buildUser = async (req) => {
    if (authResolver) {
        // Test seam (NODE_ENV=test only)
        return authResolver(req);
    }
    const auth = getAuth(req);
    if (!auth?.userId) return null;
    const profile = await resolveLocalUser(auth.userId);
    if (!profile) return null;
    return {
        _id: profile.id,
        role: profile.role,
        name: profile.name,
        email: profile.email,
        clerkId: auth.userId,
    };
};

export const protect = async (req, res, next) => {
    try {
        const user = await buildUser(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }
        req.user = user;
        next();
    } catch (error) {
        if (error.statusCode === 401) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
        }
        // Clerk unreachable / network failure — surface as server error, never auth success
        next(error);
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};

/**
 * Optional auth: attaches req.user when a valid session exists, otherwise
 * proceeds as guest (used by public endpoints that personalise responses).
 */
export const optionalProtect = async (req, res, next) => {
    try {
        const user = await buildUser(req);
        if (user) req.user = user;
        next();
    } catch {
        // Guest access must never fail because identity resolution failed
        next();
    }
};

/** Used by server.js to turn a verified Clerk session token (socket handshake)
 *  into the same local profile object `protect` builds. */
export { resolveLocalUser };
