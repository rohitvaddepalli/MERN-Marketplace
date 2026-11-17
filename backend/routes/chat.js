import express from 'express';
import { query, isUuid } from '../db/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:roomId', protect, async (req, res) => {
    try {
        const { roomId } = req.params;
        const myId = req.user._id.toString();

        const parts = roomId.split('_');
        if (parts.length !== 2 || !parts.every((p) => isUuid(p))) {
            return res.status(400).json({ success: false, message: 'Invalid room ID' });
        }

        if (!parts.includes(myId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { rows } = await query(
            `SELECT m.id, m.room_id, m.text, m.created_at,
                    u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
             FROM messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.room_id = $1
             ORDER BY m.created_at DESC
             LIMIT 50`,
            [roomId]
        );

        const messages = rows.reverse().map((r) => ({
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
