# 🔥 Firebase Deployment Guide - Complete

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [What Gets Deployed](#what-gets-deployed)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Testing & Monitoring](#testing--monitoring)
7. [Updating Deployment](#updating-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Cost & Limits](#cost--limits)

---

## Quick Start

### Automated Deployment (Easiest!)

```powershell
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Deploy everything
.\deploy-firebase.ps1
```

**Done!** Your app will be live in ~5 minutes at `https://your-project-id.web.app`

---

## What Gets Deployed

```
Firebase Project
├── 🌐 Hosting → React Frontend (frontend/build)
├── ⚡ Cloud Functions → Express Backend (functions/)
└── 🗄️ Database → MongoDB Atlas (external, connected via Functions)
```

**Your URLs:**
- Frontend: `https://your-project-id.web.app`
- API: `https://your-project-id.web.app/api/*` (same domain!)

**Benefits:**
- ✅ No CORS issues (same domain)
- ✅ Auto SSL certificate
- ✅ Global CDN
- ✅ Auto-scaling
- ✅ **$0/month**

---

## Prerequisites

### 1. Accounts (All Free)
- [ ] Google account (for Firebase)
- [ ] MongoDB Atlas account

### 2. Software
- [ ] Node.js (v14+)
- [ ] npm or yarn
- [ ] Firebase CLI: `npm install -g firebase-tools`

---

## Step-by-Step Deployment

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Project name: `mern-marketplace` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**
6. **Copy your Project ID** from project settings

### Step 2: Enable Firebase Services

#### Enable Firestore
1. Click **"Firestore Database"** → **"Create database"**
2. Mode: **"Production mode"**
3. Location: Choose closest region
4. Click **"Enable"**

#### Enable Cloud Functions
1. Click **"Functions"** → **"Get started"**
2. Upgrade to **Blaze Plan** (Pay-as-you-go)
   - Don't worry! Free tier is generous
   - Set budget alert to $1 (you won't hit it)
3. Add payment method
4. Click **"Continue"**

### Step 3: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create account (free)
3. Create **FREE M0 Cluster**:
   - Provider: AWS (or any)
   - Region: Closest to you
   - Cluster name: `marketplace`
4. Create **Database User**:
   - Username: `admin`
   - Password: Auto-generate and **save it**
5. **Network Access**:
   - Add IP Address → "Allow from Anywhere" (`0.0.0.0/0`)
6. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your actual password

**Save this connection string!**

### Step 4: Update Firebase Project ID

Edit `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 5: Initialize Firebase

```powershell
cd c:\Users\USER\Desktop\Rohit\Marketplace
firebase init
```

**Select:**
- [x] Functions
- [x] Hosting

**Configure:**
- Project: **Use existing project** (select yours)
- Language: **JavaScript**
- ESLint: **No**
- Install dependencies: **Yes**
- Public directory: `frontend/build`
- Single-page app: **Yes**
- Overwrite index.html: **No**

### Step 6: Set Up Cloud Functions

```powershell
# Copy template files
Copy-Item functions-package.json.template functions/package.json
Copy-Item functions-index.js.template functions/index.js

# Install dependencies
cd functions
npm install
cd ..
```

### Step 7: Configure Environment Variables

```powershell
# MongoDB connection (use your actual connection string!)
firebase functions:config:set mongodb.uri="mongodb+srv://admin:YOUR_PASSWORD@cluster.mongodb.net/marketplace?retryWrites=true&w=majority"

# JWT secret (use a strong random string)
firebase functions:config:set jwt.secret="your-super-secret-jwt-key-12345"

# Session secret (use a strong random string)
firebase functions:config:set session.secret="your-session-secret-12345"

# Email config (optional, for password reset)
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-gmail-app-password"

# Verify configuration
firebase functions:config:get
```

### Step 8: Build Frontend

```powershell
cd frontend
npm run build
cd ..
```

### Step 9: Deploy Everything

```powershell
firebase deploy
```

**Wait 2-5 minutes** for deployment to complete.

### Step 10: Get Your Live URLs

After successful deployment:
```
✔  Deploy complete!

Hosting URL: https://your-project-id.web.app
```

**Test it:**
- Frontend: `https://your-project-id.web.app`
- API Health: `https://your-project-id.web.app/api/health`

---

## Environment Configuration

### Frontend (.env.production)
```env
# Empty = uses relative paths (same domain)
REACT_APP_API_URL=
```

### Backend (Firebase Functions Config)
```powershell
# View all config
firebase functions:config:get

# Set a value
firebase functions:config:set key.subkey="value"

# Remove a value
firebase functions:config:unset key.subkey
```

**Required Variables:**
- `mongodb.uri` - MongoDB Atlas connection string
- `jwt.secret` - JWT signing secret
- `session.secret` - Session secret

**Optional Variables:**
- `email.user` - Email for password reset
- `email.pass` - Email app password

---

## Testing & Monitoring

### Local Testing (Before Deployment)

```powershell
# Start Firebase emulators
firebase emulators:start

# In another terminal
cd frontend
npm start
```

Access at: `http://localhost:5000`

### Production Testing

After deployment:
1. ✅ Visit `https://your-project-id.web.app`
2. ✅ Test `/api/health` endpoint
3. ✅ Register new user
4. ✅ Login
5. ✅ Browse products
6. ✅ Add to cart
7. ✅ Place order

### View Logs

```powershell
# All function logs
firebase functions:log

# Real-time logs
firebase functions:log --follow

# Specific function
firebase functions:log --only api

# Last 100 lines
firebase functions:log --limit 100
```

### Firebase Console Monitoring

Go to https://console.firebase.google.com/ → Your Project:

- **Hosting**: Bandwidth, requests, deploy history
- **Functions**: Invocations, errors, execution time, memory usage
- **Firestore**: Reads, writes, storage (if using)

---

## Updating Deployment

### Update Frontend Only
```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

### Update Backend Only
```powershell
firebase deploy --only functions
```

### Update Everything
```powershell
cd frontend
npm run build
cd ..
firebase deploy
```

### Rollback to Previous Version
```powershell
# View hosting releases
firebase hosting:releases:list

# Rollback
firebase hosting:rollback
```

---

## Troubleshooting

### Common Issues

#### "Firebase command not found"
```powershell
npm install -g firebase-tools
# Restart terminal
```

#### "Not authorized"
```powershell
firebase logout
firebase login --reauth
```

#### "Functions deployment failed"
```powershell
# Check detailed logs
firebase deploy --only functions --debug

# Verify config
firebase functions:config:get

# Check functions/package.json exists
# Check functions/index.js exists
```

#### "MongoDB connection error"
**Solutions:**
- Verify connection string is correct
- Check IP whitelist includes `0.0.0.0/0`
- Verify database user credentials
- Test connection locally first

#### "CORS errors"
**Already handled!** The `functions/index.js` template includes:
```javascript
app.use(cors({ origin: true, credentials: true }));
```

#### "Cold start is slow (5-10 seconds)"
**Normal for free tier!** Functions sleep after 15 min of inactivity.

**Solutions:**
- Use the included `keepWarm` function (pings every 5 min)
- Upgrade to paid tier for always-on
- Accept it (only affects first request)

#### "Build failed"
```powershell
# Clear cache
cd frontend
rm -rf node_modules build
npm install
npm run build
```

---

## Cost & Limits

### Firebase Free Tier (Spark Plan)

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| **Hosting** | 10 GB storage<br>360 MB/day bandwidth | ~100 MB<br>~10 MB/day |
| **Cloud Functions** | 2M invocations/month<br>400K GB-seconds<br>200K CPU-seconds | ~50K invocations<br>~10K GB-seconds |

### MongoDB Atlas Free Tier (M0)

| Resource | Free Tier | Typical Usage |
|----------|-----------|---------------|
| **Storage** | 512 MB | ~50-100 MB |
| **RAM** | Shared | Sufficient |
| **Connections** | 500 | ~10-20 |

### What This Means

**You can handle:**
- ~1,000 daily active users
- ~60,000 API requests/day
- ~10,000 products in database
- ~1,000 orders/day

**Total Monthly Cost: $0** 🎉

### Set Budget Alerts

1. Firebase Console → Project Settings → Usage and billing
2. Set budget alert to $1
3. Get email if you approach limits (you won't!)

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│         User's Browser              │
└────────────┬────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────┐
│    Firebase Hosting (CDN)           │
│    • React Frontend                 │
│    • Static files                   │
│    • Routes /api/** to Functions    │
└────────────┬────────────────────────┘
             │ Internal routing
             ▼
┌─────────────────────────────────────┐
│    Cloud Functions                  │
│    • Express Backend                │
│    • API endpoints                  │
│    • Business logic                 │
└────────────┬────────────────────────┘
             │ MongoDB connection
             ▼
┌─────────────────────────────────────┐
│    MongoDB Atlas                    │
│    • Database                       │
│    • Collections                    │
│    • Data storage                   │
└─────────────────────────────────────┘
```

---

## Quick Reference Commands

```powershell
# Login/Logout
firebase login
firebase logout

# Initialize
firebase init

# Deploy
firebase deploy                    # Everything
firebase deploy --only hosting     # Frontend only
firebase deploy --only functions   # Backend only

# Logs
firebase functions:log             # View logs
firebase functions:log --follow    # Real-time

# Config
firebase functions:config:set key="value"
firebase functions:config:get
firebase functions:config:unset key

# Projects
firebase projects:list             # List all projects
firebase use project-name          # Switch project
firebase use --add                 # Add project alias

# Emulators
firebase emulators:start           # Test locally
```

---

## Success Checklist

- [ ] Firebase CLI installed
- [ ] Logged in to Firebase
- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Cloud Functions enabled (Blaze plan)
- [ ] MongoDB Atlas cluster created
- [ ] `.firebaserc` updated with project ID
- [ ] `firebase init` completed
- [ ] Template files copied to `functions/`
- [ ] Environment variables configured
- [ ] Frontend builds successfully
- [ ] Deployed with `firebase deploy`
- [ ] Website loads at `.web.app` URL
- [ ] `/api/health` returns success
- [ ] Can register/login users
- [ ] Can browse products
- [ ] Can place orders

---

## Next Steps

### After Successful Deployment

1. **Share your URL** with users
2. **Monitor usage** in Firebase Console
3. **Set up custom domain** (optional)
4. **Enable Firebase Authentication** (optional upgrade)
5. **Add Cloud Storage** for images (optional)
6. **Set up CI/CD** with GitHub Actions (optional)

### Custom Domain Setup

1. Firebase Console → Hosting → Add custom domain
2. Enter your domain name
3. Follow DNS configuration instructions
4. Wait for SSL provisioning (automatic)

---

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Hosting**: https://firebase.google.com/docs/hosting
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

---

## Summary

You've successfully configured your MERN Marketplace for Firebase deployment!

**What you get:**
- ✅ Frontend on Firebase Hosting
- ✅ Backend on Cloud Functions
- ✅ MongoDB Atlas database
- ✅ Auto SSL certificate
- ✅ Global CDN
- ✅ Auto-scaling
- ✅ **$0/month cost**

**To deploy, just run:**
```powershell
.\deploy-firebase.ps1
```

**Your app will be live in ~5 minutes!** 🚀

---

*Last updated: December 2025*
