import express from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/chat/:roomId
 * Returns the last 50 messages for a chat room.
 * Only participants (whose IDs form the roomId) may access it.
 */
router.get('/:roomId', protect, async (req, res) => {
    try {
        const { roomId } = req.params;
        const myId = req.user._id.toString();

        // Validate: roomId must be exactly two 24-char ObjectId strings joined by '_'
        const parts = roomId.split('_');
        if (parts.length !== 2 || !parts.every((p) => /^[a-f0-9]{24}$/i.test(p))) {
            return res.status(400).json({ success: false, message: 'Invalid room ID' });
        }

        // Ensure the requester is one of the two participants
        if (!parts.includes(myId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const messages = await Message.find({ roomId })
            .sort({ createdAt: 1 })
            .limit(50)
            .populate('sender', 'name avatar');

        res.json({ success: true, messages });
    } catch (_error) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

export default router;
