import { onRequest } from 'firebase-functions/v2/https';
import { app } from './server.js';

// Build the explicit CORS origin list from environment variables.
// Using cors: true would bypass the app's own CORS whitelist.
const allowedCorsOrigins = [
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    // Always allow localhost variants in non-production so local dev still works
    ...(process.env.NODE_ENV !== 'production'
        ? ['http://localhost:3000', 'http://localhost:5000']
        : []),
].filter(Boolean); // remove undefined/null entries

// Export the Express app as a single HTTPS Cloud Function named 'api'.
// Memory is kept at 256MiB to stay comfortably within the Spark (free) plan.
// timeoutSeconds: 60 matches the Spark plan maximum.
export const api = onRequest(
    {
        memory: '256MiB',
        timeoutSeconds: 60,
        maxInstances: 10,
        cors: allowedCorsOrigins.length > 0 ? allowedCorsOrigins : false,
    },
    app
);
