import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        // SECURITY: Do NOT destructure 'role' from req.body to prevent privilege escalation
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user - ALWAYS set role to 'customer' server-side
        // Role elevation to 'seller' or 'admin' should only happen through protected admin routes
        const user = await User.create({
            name,
            email,
            password,
            role: 'customer', // SECURITY: Never accept role from user input
            phone
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address
        };

        const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset for your Marketplace account.</p>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
            <p>Or copy and paste this URL into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Marketplace Team</p>
        `;

        try {
            // Dynamically import sendEmail
            const { default: sendEmail } = await import('../utils/sendEmail.js');

            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request - Marketplace',
                message
            });

            res.status(200).json({
                success: true,
                message: 'Password reset link sent to your email'
            });
        } catch (err) {
            console.error('Email error:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please try again later.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const crypto = await import('crypto');

        // Get hashed token
        const resetPasswordToken = crypto.default
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            message: 'Password reset successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Social Login Callback
// @route   GET /api/auth/google/callback
// @access  Public
export const socialLoginCallback = (req, res) => {
    const token = generateToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login/success?token=${token}`);
};
