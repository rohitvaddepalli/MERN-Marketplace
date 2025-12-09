# 🔥 Firebase Deployment - Quick Reference Card

## 📋 Prerequisites Checklist
- [ ] Node.js installed
- [ ] Firebase account (free Gmail)
- [ ] MongoDB Atlas account (free)

---

## ⚡ Quick Deploy (3 Steps)

### 1. Install & Login
```powershell
npm install -g firebase-tools
firebase login
```

### 2. Run Automated Script
```powershell
.\deploy-firebase.ps1
```

### 3. Done!
Your app is live at: `https://your-project-id.web.app`

---

## 🔧 Manual Deploy (If Script Fails)

### Step 1: Initialize
```powershell
firebase init
# Select: Functions, Hosting
# Public dir: frontend/build
# SPA: Yes
```

### Step 2: Setup Functions
```powershell
Copy-Item functions-package.json.template functions/package.json
Copy-Item functions-index.js.template functions/index.js
cd functions
npm install
cd ..
```

### Step 3: Configure
```powershell
firebase functions:config:set mongodb.uri="YOUR_MONGODB_URI"
firebase functions:config:set jwt.secret="YOUR_SECRET"
firebase functions:config:set session.secret="YOUR_SESSION_SECRET"
```

### Step 4: Build & Deploy
```powershell
cd frontend
npm run build
cd ..
firebase deploy
```

---

## 🌐 URLs After Deployment

| Service | URL |
|---------|-----|
| **Frontend** | `https://your-project-id.web.app` |
| **API** | `https://your-project-id.web.app/api/*` |
| **Health Check** | `https://your-project-id.web.app/api/health` |
| **Console** | `https://console.firebase.google.com` |

---

## 🔄 Update Commands

```powershell
# Update frontend only
cd frontend && npm run build && cd .. && firebase deploy --only hosting

# Update backend only
firebase deploy --only functions

# Update everything
cd frontend && npm run build && cd .. && firebase deploy
```

---

## 📊 View Logs

```powershell
# All logs
firebase functions:log

# Real-time
firebase functions:log --follow

# Specific function
firebase functions:log --only api
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **Command not found** | `npm install -g firebase-tools` |
| **Not authorized** | `firebase login --reauth` |
| **Deploy failed** | `firebase deploy --debug` |
| **MongoDB error** | Check connection string & IP whitelist |
| **CORS error** | Already handled (check functions/index.js) |

---

## 💰 Free Tier Limits

| Service | Limit | Enough For |
|---------|-------|------------|
| **Hosting** | 10 GB, 360 MB/day | ~1000 users/day |
| **Functions** | 2M invocations | ~60K requests/day |
| **MongoDB** | 512 MB | ~10K products |

**Total Cost: $0/month** ✅

---

## 📚 Full Documentation

| File | Purpose |
|------|---------|
| **README_FIREBASE.md** | Complete guide |
| **FIREBASE_SUMMARY.md** | What changed |
| **DEPLOY_TO_FIREBASE.md** | Step-by-step |
| **deploy-firebase.ps1** | Auto script |

---

## ✅ Success Checklist

- [ ] Deployed successfully
- [ ] Frontend loads at `.web.app`
- [ ] `/api/health` returns success
- [ ] Can register new user
- [ ] Can login
- [ ] Can browse products
- [ ] Can place order

---

## 🎯 Common Tasks

### Set Environment Variable
```powershell
firebase functions:config:set key.subkey="value"
```

### View Configuration
```powershell
firebase functions:config:get
```

### Test Locally
```powershell
firebase emulators:start
```

### Switch Projects
```powershell
firebase use project-name
```

---

## 📞 Support

- **Docs**: See README_FIREBASE.md
- **Firebase**: https://firebase.google.com/docs
- **MongoDB**: https://docs.atlas.mongodb.com/

---

**Print this card for quick reference!** 📄
