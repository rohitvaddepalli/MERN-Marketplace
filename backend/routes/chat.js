import express from 'express';
import { query } from '../db/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/chat/:roomId
 * Returns the last 50 messages for a chat room.
 * Only participants (whose UUIDs form the roomId) may access it.
 */
router.get('/:roomId', protect, async (req, res) => {
    try {
        const { roomId } = req.params;
        const myId = req.user._id.toString();

        // Validate: roomId must be exactly two UUIDs joined by '_'
        const parts = roomId.split('_');
        if (parts.length !== 2 || !parts.every((p) => UUID_RE.test(p))) {
            return res.status(400).json({ success: false, message: 'Invalid room ID' });
        }

        // Ensure the requester is one of the two participants
        if (!parts.includes(myId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { rows } = await query(
            `SELECT m.id, m.room_id, m.text, m.created_at,
                    u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
             FROM messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.room_id = $1
             ORDER BY m.created_at ASC
             LIMIT 50`,
            [roomId]
        );

        const messages = rows.map((r) => ({
            _id: r.id,
            roomId: r.room_id,
            text: r.text,
            createdAt: r.created_at,
            sender: {
                _id: r.sender_id,
                name: r.sender_name,
                avatar: r.sender_avatar ?? null,
            },
        }));

        res.json({ success: true, messages });
    } catch (_error) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

export default router;
