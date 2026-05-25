/**
 * authService.js
 *
 * Business logic for authentication:
 *   - Token generation (JWT)
 *   - Cookie option factory
 *   - Password hashing helpers (delegated to User model via bcrypt pre-save)
 *   - Token response builder (shared by login, register, Google OAuth, etc.)
 *   - Email dispatch for password reset
 *
 * The controller (authController.js) should only call these functions and
 * translate the results into HTTP responses — no crypto or JWT logic there.
 */

import jwt from 'jsonwebtoken';

// ── Token generation ──────────────────────────────────────────────────────────

/**
 * Sign a JWT that carries the minimal claims needed by the `protect` middleware.
 * Including `role` here means auth middleware never needs a DB lookup.
 *
 * @param {{ _id: string, role: string }} user
 * @returns {string} signed JWT
 */
export const generateToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });

// ── Cookie options ────────────────────────────────────────────────────────────

/**
 * Returns HTTP-only cookie options appropriate for the current environment.
 * SameSite must be 'none' (not 'strict') because the frontend and backend
 * live on different origins in production.  SameSite=none REQUIRES secure:true.
 *
 * @returns {import('express').CookieOptions}
 */
export const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        path: '/',
    };
};

// ── Unified token response ────────────────────────────────────────────────────

/**
 * Build and send the standard auth response:
 *   1. Signs a JWT and sets it as an HTTP-only cookie.
 *   2. Returns { success, token, user } — token is included for clients that
 *      cannot use cookies (e.g. mobile apps, Postman).
 *
 * @param {Object} user      - Mongoose User document
 * @param {number} statusCode - HTTP status to send
 * @param {import('express').Response} res
 * @param {string} [message] - Optional message included in the response body
 */
export const sendTokenResponse = (user, statusCode, res, message = null) => {
    const token = generateToken(user);

    res.cookie('access_token', token, getCookieOptions());

    const responseData = {
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
        },
    };

    if (message) responseData.message = message;

    res.status(statusCode).json(responseData);
};

// ── Password reset email ──────────────────────────────────────────────────────

/**
 * Dispatch a password-reset email.
 * Generates the reset URL from env vars and delegates SMTP work to sendEmail.
 *
 * @param {{ email: string, resetToken: string }} options
 * @returns {Promise<void>}
 * @throws If the email transport fails (caller should clear the token on error)
 */
export const sendPasswordResetEmail = async ({ email, resetToken }) => {
    const frontendUrl =
        process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your Marketplace account.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#FF6B35;color:white;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color:#666;font-size:12px;">Marketplace Team</p>
    `;

    // Static import kept here; dynamic import is unnecessary overhead on the hot path
    const { default: sendEmail } = await import('../utils/sendEmail.js');

    await sendEmail({
        email,
        subject: 'Password Reset Request - Marketplace',
        message,
    });
};
