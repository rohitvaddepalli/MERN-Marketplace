import { onRequest } from 'firebase-functions/v2/https';
import { app } from './server.js';

// Build the explicit CORS origin list from environment variables.
// Using cors: true would bypass the app's own CORS whitelist, so we replicate
// the same allowed-origins logic here (#9 — Firebase entry CORS override fix).
const allowedCorsOrigins = [
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    // Always allow localhost variants in non-production so local dev still works
    ...(process.env.NODE_ENV !== 'production'
        ? ['http://localhost:3000', 'http://localhost:5000']
        : []),
].filter(Boolean); // remove undefined/null entries

// Create and export the Cloud Function
// This exposes the Express app as a single HTTPS function named 'api'
export const api = onRequest(
    {
        // Configuration options
        memory: '512MiB',
        maxInstances: 10,
        // Explicitly list allowed origins instead of cors: true so we don't
        // override the app-level CORS whitelist. (#9)
        cors: allowedCorsOrigins.length > 0 ? allowedCorsOrigins : false,
    },
    app
);
