import User from '../models/User.js';
import {
    generateToken,
    getCookieOptions,
    sendTokenResponse,
    sendPasswordResetEmail,
} from '../services/authService.js';
import { BaseController } from './BaseController.js';
import config from '../config/unifiedConfig.js';
import crypto from 'crypto';

class AuthController extends BaseController {
    // @desc    Register user
    // @route   POST /api/auth/register
    // @access  Public
    register = async (req, res) => {
        // SECURITY: Only allow 'customer' or 'seller' roles from public registration
        // Admin role must be granted via database or admin panel
        const { name, email, password, phone } = req.body;
        let { role } = req.body;

        if (role && !['customer', 'seller'].includes(role)) {
            role = 'customer';
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'customer',
            phone,
        });

        sendTokenResponse(user, 201, res);
    };

    // @desc    Login user
    // @route   POST /api/auth/login
    // @access  Public
    login = async (req, res) => {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Check for user
        // We also need loginAttempts and lockUntil to handle brute-force protection
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // SECURITY: Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({
                success: false,
                message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Atomically reset if lock expired, otherwise increment
            const expiredUnlock = await User.updateOne(
                { _id: user._id, lockUntil: { $lte: Date.now() } },
                { $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } }
            );

            if (expiredUnlock.modifiedCount === 0) {
                // Was not expired (either null or actively locked). Increment attempts.
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $inc: { loginAttempts: 1 } },
                    { new: true }
                );
                
                // Check threshold after increment and apply lock atomically
                if (updatedUser && updatedUser.loginAttempts >= 5 && !updatedUser.lockUntil) {
                    await User.updateOne(
                        { _id: user._id, lockUntil: null }, 
                        { $set: { lockUntil: Date.now() + 15 * 60 * 1000 } }
                    );
                }
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
            await User.updateOne(
                { _id: user._id },
                { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } }
            );
        }

        sendTokenResponse(user, 200, res);
    };

    // @desc    Get current logged in user
    // @route   GET /api/auth/me
    // @access  Private
    getMe = async (req, res) => {
        // Re-fetch from DB here — this is the one route that needs fresh user data.
        // All other protected routes use the lightweight JWT payload via req.user.
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        this.handleSuccess(res, { user }, 200);
    };

    // @desc    Update user profile
    // @route   PUT /api/auth/updateprofile
    // @access  Private
    updateProfile = async (req, res) => {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
        };

        const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        });

        this.handleSuccess(res, { user }, 200);
    };

    // @desc    Forgot password
    // @route   POST /api/auth/forgotpassword
    // @access  Public
    forgotPassword = async (req, res) => {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // SECURITY: Prevent user enumeration by returning the same success message
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Dispatch password-reset email via service (URL building + SMTP live there)
        try {
            await sendPasswordResetEmail({ email: user.email, resetToken });
        } catch (err) {
            await User.updateOne(
                { _id: user._id, resetPasswordToken: user.resetPasswordToken },
                { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } }
            );
            // Log error internally if needed, but don't leak it
        }

        return res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    };

    // @desc    Reset password
    // @route   PUT /api/auth/resetpassword/:resettoken
    // @access  Public
    resetPassword = async (req, res) => {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res, 'Password reset successful');
    };

    // @desc    Social Login Callback
    // @route   GET /api/auth/google/callback
    // @access  Public
    socialLoginCallback = (req, res) => {
        const token = generateToken(req.user);
        const frontendUrl = config.frontendUrl;

        // Set HTTP-only cookie for the token
        res.cookie('access_token', token, getCookieOptions());

        // SECURITY: Use URL fragment instead of query param
        // Fragments are not sent to the server in HTTP requests, reducing exposure
        // The frontend will read the fragment and clear it immediately
        res.redirect(`${frontendUrl}/login/success#authenticated=true`);
    };

    // @desc    Logout user - clear auth cookie
    // @route   POST /api/auth/logout
    // @access  Private
    logout = (req, res) => {
        res.cookie('access_token', '', {
            httpOnly: true,
            expires: new Date(0), // Expire immediately
            path: '/',
        });

        this.handleSuccess(res, { message: 'Logged out successfully' }, 200);
    };
}

export default new AuthController();
