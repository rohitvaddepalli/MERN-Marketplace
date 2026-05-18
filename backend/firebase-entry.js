import { onRequest } from 'firebase-functions/v2/https';
import { app } from './server.js';

// Create and export the Cloud Function
// This exposes the Express app as a single HTTPS function named 'api'
export const api = onRequest(
    {
        // Configuration options
        memory: '512MiB',
        maxInstances: 10,
        cors: true,
    },
    app
);
