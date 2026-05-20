import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// SECURITY: Credentials loaded from environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics is optional – only initialise if measurementId is present AND
// we are in a browser context (not SSR / Cloud Functions). Calling
// getAnalytics() without a valid measurementId throws at runtime.
let analytics = null;
if (
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID &&
    typeof window !== 'undefined'
) {
    import('firebase/analytics').then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
    });
}

export { app, analytics, auth, db, storage };
