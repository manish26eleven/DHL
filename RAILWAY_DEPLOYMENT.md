# 🚀 Deploy to Railway.app - Step by Step Guide

## What We're Doing

Deploying your DHL Rate Calculator in 2 parts:
- **Backend (Node.js)** → Railway.app (free trial)
- **Frontend (React)** → Hostinger (your existing hosting)

## ⏱️ Time Required: ~15 minutes

---

## PART 1: Deploy Backend to Railway (10 min)

### Step 1: Create GitHub Repository

1. **Open Terminal** and navigate to your project:
   ```bash
   cd /Users/mac/Desktop/extra/DHL
   ```

2. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Create repository on GitHub:**
   - Go to https://github.com/new
   - Name: `dhl-rate-calculator`
   - Click "Create repository"
   - **Don't initialize with README**

4. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/dhl-rate-calculator.git
   git branch -M main
   git push -u origin main
   ```
   
   Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 2: Deploy to Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Click "Start a New Project"
   - Sign in with GitHub

2. **Create New Project:**
   - Click "Deploy from GitHub repo"
   - Select `dhl-rate-calculator`
   - Railway will detect your Node.js app

3. **Configure Environment Variables:**
   - Click on your deployment
   - Go to **Variables** tab
   - Add these variables one by one:

   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your-secret-here
   
   FEDEX_CLIENT_ID_1=your-fedex-id-1
   FEDEX_CLIENT_SECRET_1=your-fedex-secret-1
   FEDEX_CLIENT_ID_2=your-fedex-id-2
   FEDEX_CLIENT_SECRET_2=your-fedex-secret-2
   FEDEX_CLIENT_ID_3=your-fedex-id-3
   FEDEX_CLIENT_SECRET_3=your-fedex-secret-3
   
   DHL_API_KEY_1=v62_LSqKQdDz2S
   DHL_API_SECRET_1=HtOuUf9FzP
   DHL_ACCOUNT_NUMBER_1=136171263
   DHL_API_KEY_2=v62_LSqKQdDz2S
   DHL_API_SECRET_2=HtOuUf9FzP
   DHL_ACCOUNT_NUMBER_2=425910155
   DHL_API_KEY_3=v62_LSqKQdDz2S
   DHL_API_SECRET_3=HtOuUf9FzP
   DHL_ACCOUNT_NUMBER_3=425091463
   ```

4. **Get Your Railway URL:**
   - Go to **Settings** tab
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-app.railway.app`)
   - ✅ **SAVE THIS URL** - you'll need it!

---

## PART 2: Deploy Frontend to Hostinger (5 min)

### Step 1: Build React App

1. **Create production environment file:**
   ```bash
   cd /Users/mac/Desktop/extra/DHL/client
   echo "REACT_APP_API_URL=https://your-app.railway.app" > .env.production
   ```
   
   Replace `https://your-app.railway.app` with YOUR actual Railway URL!

2. **Build the app:**
   ```bash
   npm run build
   ```

   This creates a `build/` folder with your production files.

### Step 2: Upload to Hostinger

1. **Login to Hostinger:**
   - Go to hpanel.hostinger.com
   - Login with your email

2. **Open File Manager:**
   - Go to **Hosting** → **File Manager**
   - Navigate to `public_html/`

3. **Clear public_html:**
   - Select all files in `public_html/`
   - Delete them (or move to backup folder)

4. **Upload React Build:**
   - Click **Upload Files**
   - Select ALL files from `/Users/mac/Desktop/extra/DHL/client/build/`
   - Upload them directly to `public_html/`
   - **Make sure files are in root of public_html, not in a subfolder!**

### Step 3: Configure Domain

If your domain is already pointing to Hostinger, you're done!

If not:
1. Go to **DNS/Nameservers** in Hostinger
2. Make sure A Record points to Hostinger's IP
3. Wait 5-10 minutes for DNS propagation

---

## ✅ Test Your Deployment

1. **Visit your domain** (e.g., `https://equatorworldwide.co.uk`)
2. You should see the login page
3. Try logging in and uploading a test Excel file
4. Rates should calculate and file should download

---

## 🔧 Troubleshooting

### Problem: "Failed to fetch" or CORS error

**Solution:** Add Railway frontend URL to backend
1. Go to Railway dashboard
2. Add environment variable:
   ```
   FRONTEND_URL=https://equatorworldwide.co.uk
   ```
3. Redeploy

### Problem: Login doesn't work

**Check:** 
- Railway backend is running (check Railway logs)
- API URL in `.env.production` is correct
- Environment variables are set in Railway

### Problem: White screen on Hostinger

**Check:**
- Files are in `public_html/` root (not in a subdirectory)
- `index.html` exists in `public_html/`

---

## 📊 Monitoring

### Check Railway Logs:
1. Go to Railway dashboard
2. Click on your project
3. View **Deployments** tab
4. Click on latest deployment
5. View logs

### Check Frontend:
- Open browser console (F12)
- Look for any error messages

---

## 💰 Costs

**Railway Free Trial:**
- $5 credit included
- Lasts several weeks for low traffic
- After trial: ~$5-10/month

**Hostinger:**
- Already paid ✅

**Total:** FREE for trial period, then ~$5-10/month

---

## 🎉 You're Done!

Your app is now live at your domain with a professional setup:
- ✅ Fast frontend on Hostinger
- ✅ Reliable backend on Railway  
- ✅ Secure HTTPS
- ✅ Easy to update (just git push)

## 🔄 Updating Your App

When you make changes:

**Backend changes:**
```bash
git add .
git commit -m "Update backend"
git push
```
Railway auto-deploys!

**Frontend changes:**
```bash
cd client
npm run build
```
Then re-upload `build/` to Hostinger

---

Need help? Check Railway logs or contact support!
