# 🔥 Firebase All-in-One Deployment Script
# This script helps you deploy your entire MERN Marketplace to Firebase

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔥 Firebase All-in-One Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Installing Firebase CLI globally..." -ForegroundColor Yellow
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed!" -ForegroundColor Green
}
else {
    Write-Host "✅ Firebase CLI already installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Login to Firebase
Write-Host "Step 2: Firebase Login" -ForegroundColor Yellow
Write-Host "Opening browser for authentication..." -ForegroundColor Gray
firebase login
Write-Host "✅ Logged in to Firebase" -ForegroundColor Green

Write-Host ""

# Step 3: Check if firebase.json exists
Write-Host "Step 3: Checking Firebase configuration..." -ForegroundColor Yellow

if (Test-Path "firebase.json") {
    Write-Host "✅ firebase.json found" -ForegroundColor Green
}
else {
    Write-Host "❌ firebase.json not found" -ForegroundColor Red
    Write-Host "You need to run: firebase init" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Step 4: Check if functions folder exists
Write-Host "Step 4: Checking Cloud Functions setup..." -ForegroundColor Yellow

if (-not (Test-Path "functions")) {
    Write-Host "⚠️  Functions folder not found. Creating..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "functions" -Force | Out-Null
    
    # Copy template files
    if (Test-Path "functions-package.json.template") {
        Copy-Item "functions-package.json.template" "functions/package.json"
        Write-Host "✅ Created functions/package.json" -ForegroundColor Green
    }
    
    if (Test-Path "functions-index.js.template") {
        Copy-Item "functions-index.js.template" "functions/index.js"
        Write-Host "✅ Created functions/index.js" -ForegroundColor Green
    }
    
    # Install dependencies
    Write-Host "Installing Cloud Functions dependencies..." -ForegroundColor Yellow
    Set-Location functions
    npm install
    Set-Location ..
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "✅ Functions folder exists" -ForegroundColor Green
}

Write-Host ""

# Step 5: Check environment configuration
Write-Host "Step 5: Checking environment configuration..." -ForegroundColor Yellow
Write-Host "Getting current Firebase config..." -ForegroundColor Gray

$config = firebase functions:config:get 2>&1

if ($config -match "mongodb") {
    Write-Host "✅ MongoDB URI configured" -ForegroundColor Green
}
else {
    Write-Host "⚠️  MongoDB URI not configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to set environment variables:" -ForegroundColor Cyan
    Write-Host "  firebase functions:config:set mongodb.uri='your-mongodb-connection-string'" -ForegroundColor White
    Write-Host "  firebase functions:config:set jwt.secret='your-jwt-secret'" -ForegroundColor White
    Write-Host "  firebase functions:config:set session.secret='your-session-secret'" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Deployment cancelled. Please configure environment variables first." -ForegroundColor Red
        exit
    }
}

Write-Host ""

# Step 6: Build Frontend
Write-Host "Step 6: Building React frontend..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path "node_modules") {
    Write-Host "Dependencies already installed" -ForegroundColor Gray
}
else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Building production bundle..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    Set-Location ..
    exit
}

Set-Location ..

Write-Host ""

# Step 7: Deploy to Firebase
Write-Host "Step 7: Deploying to Firebase..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will deploy:" -ForegroundColor Cyan
Write-Host "  ✓ Frontend to Firebase Hosting" -ForegroundColor White
Write-Host "  ✓ Backend to Cloud Functions" -ForegroundColor White
Write-Host ""

$deploy = Read-Host "Ready to deploy? (y/n)"

if ($deploy -eq "y") {
    Write-Host ""
    Write-Host "Deploying..." -ForegroundColor Yellow
    firebase deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  🎉 Deployment Successful!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your app is now live!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Check Firebase Console for your URLs" -ForegroundColor White
        Write-Host "2. Test your application" -ForegroundColor White
        Write-Host "3. Monitor logs: firebase functions:log" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        Write-Host "Check the error messages above" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Cyan
        Write-Host "  • Make sure you've run: firebase init" -ForegroundColor White
        Write-Host "  • Check that .firebaserc has your project ID" -ForegroundColor White
        Write-Host "  • Verify environment variables are set" -ForegroundColor White
        Write-Host "  • Run: firebase deploy --debug for more info" -ForegroundColor White
    }
}
else {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
}

Write-Host ""
