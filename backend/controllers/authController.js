import { query } from '../db/index.js';
import { BaseController, pickAllowedFields } from './BaseController.js';

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
    getMe = async (req, res) => {
        const { rows } = await query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`, [
            req.user._id,
        ]);

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        this.handleSuccess(res, { user: toPublicUser(rows[0]) }, 200);
    };

    updateProfile = async (req, res) => {
        const updates = pickAllowedFields(req.body, ['name', 'phone', 'address']);
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

    logout = (req, res) => {
        this.handleSuccess(res, { message: 'Logged out successfully' }, 200);
    };
}

export default new AuthController();
