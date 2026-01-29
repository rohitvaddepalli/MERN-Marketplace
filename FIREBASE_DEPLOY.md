# Firebase Deployment Guide (Free Tier)

This guide helps you deploy your MERN Marketplace completely for free, using **Firebase Hosting** for the Frontend and **Render** for the Backend.

## Why this Hybrid Approach?
The Firebase "Spark" (Free) plan **blocks** external network requests from the backend (Cloud Functions), meaning your Node.js backend cannot connect to MongoDB Atlas if hosted on Firebase Free Tier.
*   **Solution**: Host the Frontend on **Firebase** (Fast, Free) and the Backend on **Render** (Free, supports MongoDB).

---

## Part 1: Backend Deployment (Render)

**If your backend is already on Render, skip to step 4.**

1.  Push your code to GitHub.
2.  Go to [Render.com](https://render.com) and create a **New Web Service**.
3.  Connect your repo and use these settings:
    *   **Root Directory**: `backend` (Important!)
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
    *   **Environment Variables**: Use the same ones from your `.env` (MONGODB_URI, JWT_SECRET, etc.).
4.  Copy your **Backend URL** (e.g., `https://your-app.onrender.com`).

---

## Part 2: Frontend Deployment (Firebase)

### 1. Setup Firebase Project
1.  Go to [console.firebase.google.com](https://console.firebase.google.com/).
2.  Click **Add project** -> Name it (e.g., `market-place-app`) -> Continue -> (Analytics optional) -> **Create Project**.
3.  After creation, copy the **Project ID** from *Project Settings* (it looks like `market-place-app-12345`).

### 2. Configure Local Project
1.  Open your terminal in VS Code.
2.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
3.  Login to Firebase:
    ```bash
    firebase login
    ```
4.  Connect to your project:
    ```bash
    firebase use --add
    ```
    *   Select your newly created project from the list.
    *   Give it an alias (e.g., `default`).

### 3. Connect Frontend to Backend
You need to tell the Frontend where your Backend lives.
1.  Create or edit `frontend/.env.production`:
    ```env
    REACT_APP_API_URL=https://your-backend-url.onrender.com
    ```
    *(Replace with your actual Render URL)*

### 4. Build and Deploy
1.  Build the React app:
    ```bash
    npm run build
    ```
2.  Deploy to Firebase:
    ```bash
    firebase deploy
    ```

3.  Firebase will give you a **Hosting URL** (e.g., `https://your-project.web.app`).

---

## Part 3: Final Configurations

### 1. Update Backend CORS
Your backend needs to allow requests from your new Firebase domain.
1.  Go to Render Dashboard -> Environment.
2.  Add/Update the `FRONTEND_URL` variable to your **new Firebase URL** (e.g., `https://your-project.web.app`).
    *   *Note: Without this, you will get CORS errors.*

### 2. Google Auth (Optional)
If you use Google Login:
1.  Go to Google Cloud Console.
2.  Add your Firebase domain to "Authorized JavaScript Origins" and "Authorized Redirect URIs".
3.  Also add the Firebase domain in the Firebase Console -> Authentication -> Sign-in method -> Authorized domains.

## Troubleshooting

*   **"Api Connection Failed"**: Check if `REACT_APP_API_URL` is set correctly in `.env.production` and re-run `npm run build` and `firebase deploy`.
*   **CORS Error**: Ensure the backend `FRONTEND_URL` matches your Firebase URL exactly (no trailing slash).
*   **MongoDB Error**: Ensure MongoDB Atlas has `0.0.0.0/0` in Network Access.
