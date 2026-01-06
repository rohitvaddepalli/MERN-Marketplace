import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Upload image(s) to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const urls = req.files.map(file => file.path);

        res.status(200).json({
            success: true,
            urls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});

export default router;
