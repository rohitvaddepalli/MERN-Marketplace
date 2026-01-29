# Migration to Pure Firebase (Free Tier)

Since you want to use the **Free** options (Authentication, Database, Hosting) and avoid the required payment plan for backend functions, we are switching the architecture:

**From:** MERN Stack (MongoDB, Express, React, Node)
**To:** Serverless Firebase App (React + Firebase SDKs)

### ⚠️ IMPORTANT: What you need to do now

1.  **Enable Authentication**:
    *   Go to [Firebase Console](https://console.firebase.google.com/project/marketplace-2bd82/authentication/providers).
    *   Click "Get Started".
    *   Enable **Email/Password** provider.
    *   Enable **Google** provider (optional, but code handles it).

2.  **Enable Database (Firestore)**:
    *   Go to [Firestore Database](https://console.firebase.google.com/project/marketplace-2bd82/firestore).
    *   Click "Create Database".
    *   Select a location (e.g., `nam5` or `us-central1`).
    *   **Security Rules**: Start in **Test Mode** (allows read/write for 30 days) just to get things working.

### What I have done so far:
1.  Installed `firebase` SDK in your frontend.
2.  Configured `src/firebase.js` to initialize Auth and Database.

### Next Steps (The Hard Part):
Your application currently calls your Node.js backend for everything (`/api/auth/login`, `/api/products`, etc.).
We need to **replace** those API calls with Firebase functions.

**Example Change needed in `src/pages/Login.js`:**

*Old Way:*
```javascript
const { data } = await axios.post('/api/auth/login', { email, password });
```

*New Way:*
```javascript
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

const driver = await signInWithEmailAndPassword(auth, email, password);
```

I will help you convert the most critical parts (Login/Register) now.
