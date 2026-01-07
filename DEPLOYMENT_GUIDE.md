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
| `FRONTEND_URL` | `https://your-app.onrender.com` | (Optional) Your live URL. |

> **Tip**: The app now automatically detects the Render URL via the `RENDER_EXTERNAL_URL` variable. You can leave `FRONTEND_URL` blank initially, and only update it if you use a custom domain later.

---

## Step 6: Getting your Live URL

1.  After clicking "Create Web Service", Render will start building.
2.  Look at the **top left** of the Render dashboard for your service. You will see a URL like `https://my-marketplace-app.onrender.com`.
3.  Copy this URL.
4.  If you want to be extra safe, go to **Environment** settings again and add/update `FRONTEND_URL` with this value.

---

## Step 7: Optional: Social Login (Google)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Navigate to **APIs & Services** > **Credentials**.
4.  Configure the **OAuth Consent Screen**.
5.  Create **OAuth 2.0 Client IDs**:
    *   **Application Type**: Web Application.
    *   **Authorized JavaScript Origins**: `https://your-app.onrender.com` (and `http://localhost:5000` for dev).
    *   **Authorized Redirect URIs**: `https://your-app.onrender.com/api/auth/google/callback` (and `http://localhost:5000/api/auth/google/callback` for dev).
6.  Copy your **Client ID** and **Client Secret**.
7.  Add them to your environment variables:
    *   `GOOGLE_CLIENT_ID`: Your Google Client ID.
    *   `GOOGLE_CLIENT_SECRET`: Your Google Client Secret.

---

## Step 8: Testing your Deployment

1.  Once Render finishes building (look for "Build successful" and "Server running..."), visit your Render URL.
2.  The application should load.
3.  Test functionality:
    *   Register a new user.
    *   Try uploading a product image (checks Cloudinary).
    *   Place a test order (checks Database).

---

## Alternative: Deployment on Railway.app

If Render is unavailable, **Railway** is an excellent alternative:

1.  Log in to [Railway.app](https://railway.app).
2.  Click **+ New Project** > **Deploy from GitHub repo**.
3.  Choose your repository.
4.  Click **Add Variables** and paste the same environment variables from Step 5.
5.  Railway will automatically detect your root `package.json` and run your `build` and `start` scripts.
6.  Go to the **Settings** tab and click **Generate Domain** to get your live URL.
7.  **Update `FRONTEND_URL`**: Make sure the your `FRONTEND_URL` variable matches this new Railway domain.

---

## Alternative: Deployment on Vercel

Vercel is an excellent platform for hosting the application. While primarily optimized for frontends, it can host MERN apps effectively.

### Option A: Unified Deployment (Simplest)
To deploy the entire app to Vercel as one unit:

1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New** > **Project** and import your repository.
3.  In the **Configure Project** screen:
    *   **Framework Preset**: Other
    *   **Root Directory**: Keep as `.` (root)
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `frontend/build` (Vercel will serve your built frontend)
4.  **Environment Variables**: Add all variables from Step 5.
5.  **Note**: Vercel might require a `vercel.json` in the root for API routing. If you encounter 404s on API calls, create a `vercel.json` as shown in the troubleshooting section.

### Option B: Frontend on Vercel + Backend on Render (High Performance)
Deploying the frontend alone to Vercel often provides the best speed and global performance.

1.  **Backend**: Follow Step 4 to deploy the backend to Render/Railway.
2.  **Frontend**:
    *   Import repository to Vercel, but set **Root Directory** to `frontend`.
    *   Set **Framework Preset** to `Create React App`.
    *   Add **Environment Variable**: `REACT_APP_API_URL` = `https://your-backend.onrender.com`.
3.  **CORS**: Ensure the Vercel URL is added to the backend's `FRONTEND_URL` variable.

---

## Troubleshooting

*   **Build Failure**: Ensure all `devDependencies` are listed correctly. Render runs `npm install` before the build command.
*   **Database Error**: Double-check the `MONGODB_URI` password (special characters must be URL encoded) and Atlas IP whitelist.
*   **Images not showing**: Check Cloudinary credentials and ensure `NODE_ENV` is set to `production`.
*   **CORS Issues**: Ensure `FRONTEND_URL` exactly matches your Render URL (no trailing slash).
*   **Vercel 404 on API**: If your backend routes don't work on Vercel, create a `vercel.json` in your root directory:
    ```json
    {
      "version": 2,
      "rewrites": [
        { "source": "/api/(.*)", "destination": "/backend/server.js" },
        { "source": "/(.*)", "destination": "/frontend/build/$1" }
      ]
    }
    ```
*   **Google OAuth Warnings**: If you see `⚠️ Google OAuth not configured` during startup, this is **normal** if you haven't added the credentials. Social login will be disabled but the rest of the app will work fine.
*   **Uploads Directory**: `📁 Created uploads directory` is a status message confirming the server has initialized the local storage folder for temporary file handling.
