import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { isR2Configured, buildObjectKey, uploadBuffer, presignPut } from '../config/r2.js';

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

// Memory storage — files go straight to R2, never written to disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, cb) => {
        const ok =
            file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
        cb(null, ok);
    },
});

const requireR2 = (req, res, next) => {
    if (!isR2Configured()) {
        return res.status(500).json({
            success: false,
            message: 'R2 storage not configured — set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET',
        });
    }
    next();
};

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload images to Cloudflare R2 (authenticated)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200: { description: Files uploaded }
 *       400: { description: No files uploaded }
 */
router.post('/', protect, uploadLimiter, requireR2, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded',
            });
        }

        const files = await Promise.all(
            req.files.map(async (file) => {
                const key = buildObjectKey(file.mimetype);
                const { url } = await uploadBuffer({
                    key,
                    body: file.buffer,
                    contentType: file.mimetype,
                });
                return {
                    url,
                    publicId: key,
                    type: file.mimetype.startsWith('video') ? 'video' : 'image',
                };
            })
        );

        res.status(200).json({ success: true, files });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/upload/signature:
 *   get:
 *     tags: [Upload]
 *     summary: Get a presigned R2 PUT URL for direct browser uploads
 *     responses:
 *       200: { description: Presigned upload URL issued }
 */
// Direct-to-R2 upload (frontend PUTs the file to uploadUrl with its own
// Content-Type) — keeps large files off the API server, like the old
// Cloudinary signature flow.
router.get('/signature', protect, requireR2, async (req, res) => {
    try {
        const contentType = req.query.type || 'application/octet-stream';
        const key = buildObjectKey(contentType);
        const result = await presignPut({ key, contentType });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating upload URL',
            error: error.message,
        });
    }
});

export default router;
