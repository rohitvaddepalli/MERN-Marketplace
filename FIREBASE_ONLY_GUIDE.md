# How to Deploy "Only Firebase" (Full Stack)

You requested to use **only Firebase** and no other providers. We have reconfigured the project to host both the:
1.  **Frontend** (Firebase Hosting)
2.  **Backend** (Firebase Cloud Functions)

## ⚠️ Important Prerequisites

To host a Node.js Backend on Firebase, you **MUST** be on the **Blaze Plan** (Pay-as-you-go).
*   **Why?** The Free "Spark" plan allows hosting static sites, but it **does not support** modern Cloud Functions (Node.js 10+).
*   **Cost**: The Blaze plan has a generous free tier (2 million invocations/month). For a personal/startup project, you will likely pay **$0**. However, you **must** link a credit/debit card to Google Cloud.
*   **Database**: Since you are using MongoDB Atlas, the Blaze plan allows your functions to talk to the external MongoDB database. (The Free Spark plan blocks this).

---

## Step 1: Install Dependencies

We need to add Firebase libraries to your backend so it can run as a function.

1.  Open your terminal in the `backend` folder:
    ```bash
    cd backend
    npm install firebase-functions firebase-admin
    # Ensure you are logged in
    firebase login
    ```

## Step 2: Build the Frontend

1.  Go to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  **Update API URL**:
    Since we are now hosting everything on the same domain, you can use a relative path or the deployed function URL.
    Open `frontend/.env.production` and change the URL to:
    ```env
    REACT_APP_API_URL=/api
    ```
    *(This works because we configured a rewrite in `firebase.json` to send `/api` requests to the backend function)*

3.  Build the app:
    ```bash
    npm run build
    ```

## Step 3: Deploy Everything

1.  Go to the **Root** of your project (where `firebase.json` is):
    ```bash
    cd ..
    ```
    *(You should be in `Marketplace/`)*

2.  Deploy:
    ```bash
    firebase deploy
    ```

## Step 4: Add Environment Variables

Your backend needs your secrets (`MONGODB_URI`, `JWT_SECRET`, etc.). In Firebase Functions, valid variables are stored in `.env` files inside the functions source being deployed.

1. Create a `.env` file inside the `backend/` folder (if you don't have one there already that is being picked up, copy your main secrets there).
   * Note: Firebase Functions automatically loads `.env` files in the `backend` directory during deployment.

---
**Summary of Changes Made:**
*   Modified `backend/server.js` to run on Firebase.
*   Created `backend/firebase-entry.js`.
*   Created a unified `firebase.json` at the root.
