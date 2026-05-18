import express from 'express';
import rateLimit from 'express-rate-limit';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many uploads, please try again later.',
    },
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload images to Cloudinary (authenticated)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200: { description: Files uploaded }
 *       400: { description: No files uploaded }
 */
router.post('/', protect, uploadLimiter, upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded',
            });
        }

        const files = req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
            type: file.mimetype.startsWith('video') ? 'video' : 'image',
        }));

        res.status(200).json({
            success: true,
            files,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message,
        });
    }
});

export default router;
