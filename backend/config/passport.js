import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// SECURITY: Only configure Google OAuth if credentials are provided
// This prevents using dummy credentials in production
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // The OAuth callback must point to the BACKEND (Render), not the frontend (Firebase).
    // Priority: GOOGLE_CALLBACK_URL (explicit) → BACKEND_URL → RENDER_EXTERNAL_URL → localhost
    const callbackURL =
        process.env.GOOGLE_CALLBACK_URL ||
        (() => {
            const base =
                process.env.BACKEND_URL ||
                (process.env.RENDER_EXTERNAL_URL
                    ? `https://${process.env.RENDER_EXTERNAL_URL}`
                    : null) ||
                (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5000');
            return base
                ? `${base.replace(/\/$/, '')}/api/auth/google/callback`
                : '/api/auth/google/callback';
        })();

    console.log('🔑 Google OAuth callback URL:', callbackURL);

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ googleId: profile.id });
                    if (user) {
                        return done(null, user);
                    }

                    user = await User.findOne({ email: profile.emails[0].value });
                    if (user) {
                        user.googleId = profile.id;
                        await user.save();
                        return done(null, user);
                    }

                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        password: 'social-login-dummy-password-' + Date.now(),
                        googleId: profile.id,
                        avatar: profile.photos[0].value,
                        role: 'customer',
                    });

                    done(null, user);
                } catch (err) {
                    done(err, null);
                }
            }
        )
    );
    console.log('✅ Google OAuth strategy configured');
} else {
    console.warn('⚠️  Google OAuth not configured - social login disabled');
}

// GitHub strategy removed per user request

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
