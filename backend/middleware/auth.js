import { getAuth, clerkClient } from '@clerk/express';
import { query } from '../db/index.js';

let authResolver = null;
export const setAuthResolverForTests = (resolver) => {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('setAuthResolverForTests is only available when NODE_ENV=test');
    }
    authResolver = resolver;
};

const resolveLocalUser = async (clerkUserId) => {
    const existing = await query(
        'SELECT id, name, email, role FROM users WHERE clerk_user_id = $1',
        [clerkUserId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    // Only use an email address verified by Clerk to prevent account takeover
    const primary = clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId);
    const verifiedObj = (primary?.verification?.status === 'verified')
        ? primary
        : clerkUser.emailAddresses?.find((e) => e.verification?.status === 'verified');
    const email = verifiedObj?.emailAddress;

    if (!email) {
        throw Object.assign(new Error('Clerk user has no verified email address'), { statusCode: 401 });
    }
    const name = clerkUser.fullName || clerkUser.firstName || email;

    // Link pre-existing account by verified email or insert new customer profile
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

    const after = await query(
        'SELECT id, name, email, role FROM users WHERE clerk_user_id = $1',
        [clerkUserId]
    );
    return after.rows[0] ?? null;
};

const buildUser = async (req) => {
    if (authResolver) return authResolver(req);
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

export const optionalProtect = async (req, res, next) => {
    try {
        const user = await buildUser(req);
        if (user) req.user = user;
        next();
    } catch {
        next();
    }
};

export { resolveLocalUser };
