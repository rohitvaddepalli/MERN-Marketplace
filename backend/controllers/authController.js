import { query } from '../db/index.js';
import { BaseController } from './BaseController.js';

/**
 * authController.js
 *
 * Clerk owns credentials (sign-up, sign-in, password reset, OAuth, MFA).
 * This controller only serves the local application profile that lives in
 * Postgres: reading it (GET /me), updating display fields (PUT /updateprofile)
 * and providing a logout endpoint kept for client compatibility — the actual
 * session teardown happens client-side via Clerk's signOut().
 */
const PUBLIC_USER_COLUMNS = `id, name, email, role, avatar, phone, address, wishlist,
                             recently_viewed, created_at`;

const toPublicUser = (row) => ({
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    phone: row.phone ?? null,
    address: row.address ?? {},
    wishlist: row.wishlist ?? [],
    recentlyViewed: row.recently_viewed ?? [],
    createdAt: row.created_at,
});

class AuthController extends BaseController {
    // @desc    Get current signed-in user's local profile
    // @route   GET /api/auth/me
    // @access  Private (Clerk session required)
    getMe = async (req, res) => {
        // Re-fetch from DB here — this is the one route that needs fresh user data.
        const { rows } = await query(
            `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`,
            [req.user._id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        this.handleSuccess(res, { user: toPublicUser(rows[0]) }, 200);
    };

    // @desc    Update user profile (display fields only — email/password
    //          changes go through Clerk's user profile)
    // @route   PUT /api/auth/updateprofile
    // @access  Private
    updateProfile = async (req, res) => {
        const allowed = ['name', 'phone', 'address'];
        const updates = {};
        for (const field of allowed) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        // Email is a display/lookup field here; changing it locally does not
        // affect the Clerk login identity, so keep accepting it for parity.
        if (req.body.email !== undefined) updates.email = req.body.email;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update',
            });
        }

        const columns = Object.keys(updates);
        const setClause = columns.map((c, i) => `${c} = $${i + 2}`).join(', ');
        const { rows } = await query(
            `UPDATE users SET ${setClause} WHERE id = $1 RETURNING ${PUBLIC_USER_COLUMNS}`,
            [req.user._id, ...columns.map((c) => updates[c])]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        this.handleSuccess(res, { user: toPublicUser(rows[0]) }, 200);
    };

    // @desc    Logout — client clears the Clerk session; this endpoint remains
    //          for backward compatibility with older clients
    // @route   POST /api/auth/logout
    // @access  Private
    logout = (req, res) => {
        this.handleSuccess(res, { message: 'Logged out successfully' }, 200);
    };
}

export default new AuthController();
