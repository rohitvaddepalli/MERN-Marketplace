import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// SECURITY: Only configure Google OAuth if credentials are provided
// This prevents using dummy credentials in production
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Build an absolute callbackURL so Google redirects to Firebase Hosting,
    // not to the raw Cloud Function URL. FRONTEND_URL should be your Firebase
    // Hosting URL (e.g. https://market-place01.web.app).
    const callbackURL = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/api/auth/google/callback`
        : process.env.NODE_ENV === 'production'
          ? '/api/auth/google/callback'
          : 'http://localhost:5000/api/auth/google/callback';

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
