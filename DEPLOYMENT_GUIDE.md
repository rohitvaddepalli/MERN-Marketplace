# Deployment Guide: MERN Marketplace

This guide provides step-by-step instructions for deploying the Marketplace application to a production environment using **Render** (Unified Backend + Frontend) and **MongoDB Atlas**.

## Prerequisites

1.  **MongoDB Atlas Account**: [Create a free cluster](https://www.mongodb.com/cloud/atlas/register).
2.  **Cloudinary Account**: [Sign up for free](https://cloudinary.com/users/register/free) for image storage.
3.  **GitHub Account**: To host your code and connect to Render.

---

## Step 1: Database Setup (MongoDB Atlas)

1.  Log in to MongoDB Atlas.
2.  Create a new Database User (keep the username and password handy).
3.  Configure IP Access: Add `0.0.0.0/0` (Allow access from everywhere) for deployment.
4.  Copy your **Connection String**: Choose "Connect your application" and copy the URI (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/marketplace?retryWrites=true&w=majority`).

## Step 2: Image Storage Setup (Cloudinary)

1.  Log in to Cloudinary.
2.  Go to the **Dashboard**.
3.  Copy your **Cloud Name**, **API Key**, and **API Secret**.

## Step 3: Preparation

1.  Ensure your code is pushed to a GitHub repository.
2.  Ensure `package.json` in the root directory has the `build` and `start` scripts (done in the latest update).

## Step 4: Deployment on Render

1.  Log in to [Render.com](https://render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `my-marketplace-app`
    *   **Environment**: `Node`
    *   **Region**: Select a region close to your users.
    *   **Branch**: `main` (or your preferred branch)
    *   **Build Command**: `npm run build`
    *   **Start Command**: `npm run start`

## Step 5: Environment Variables

In the Render dashboard for your service, go to **Environment** and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and static serving. |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string. |
| `JWT_SECRET` | `your_long_random_string` | At least 32 characters (e.g., generate via `openssl rand -base64 32`). |
| `SESSION_SECRET` | `your_secure_session_secret` | Random string for session encryption. |
| `CLOUDINARY_CLOUD_NAME` | `your_name` | Cloudinary Cloud Name. |
| `CLOUDINARY_API_KEY` | `your_key` | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET` | `your_secret` | Cloudinary API Secret. |
| `FRONTEND_URL` | `https://your-app-name.onrender.com` | Your Render app URL (for CORS and redirects). |

---

## Step 6: Verify Deployment

1.  Once Render finishes building (look for "Build successful" and "Server running..."), visit your Render URL.
2.  The application should load.
3.  Test functionality:
    *   Register a new user.
    *   Try uploading a product image (checks Cloudinary).
    *   Place a test order (checks Database).

## Troubleshooting

*   **Build Failure**: Ensure all `devDependencies` are listed correctly. Render runs `npm install` before the build command.
*   **Database Error**: Double-check the `MONGODB_URI` password (special characters must be URL encoded) and Atlas IP whitelist.
*   **Images not showing**: Check Cloudinary credentials and ensure `NODE_ENV` is set to `production`.
*   **CORS Issues**: Ensure `FRONTEND_URL` exactly matches your Render URL (no trailing slash).
