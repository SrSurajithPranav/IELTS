# 🚀 Production Deployment Guide: Vercel + Render + Supabase + Cloudinary

**Stack:**
- Frontend: React/Vite → **Vercel**
- Backend: Flask → **Render** (Web Service)
- Database: PostgreSQL → **Supabase**
- Media: Cloudinary

**Cost: Completely FREE** ✅

---

## 📋 Table of Contents
1. [Database Setup (Supabase)](#1-database-setup-supabase)
2. [Backend Setup (Render)](#2-backend-setup-render)
3. [Frontend Setup (Vercel)](#3-frontend-setup-vercel)
4. [Media Setup (Cloudinary)](#4-media-setup-cloudinary)
5. [GitHub Secrets Setup](#5-github-secrets-setup)
6. [Auto-Deployment](#6-auto-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Database Setup (Supabase)

### 1.1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start Your Project" (sign in with GitHub)
3. Create organization: `ielts-prod`

### 1.2: Create Project
1. Click "New project"
2. Project name: `ielts-prod`
3. Database password: **Save this!**
4. Region: Choose closest to you
5. Click "Create new project"
6. **Wait 3-5 minutes**

### 1.3: Get Database URL
1. In Supabase dashboard: Settings → Database
2. Copy the connection string that looks like:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
   ```
3. Replace `[PASSWORD]` with the password you set earlier

### 1.4: Initialize Schema
1. In Supabase dashboard: SQL Editor → New Query
2. Paste this:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
3. Click "Run"

**Save:** Your `DATABASE_URL` (you'll need this for Render)

---

## 2. Backend Setup (Render)

### 2.1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (authorize Render to access your repo)

### 2.2: Create Web Service
1. In Render dashboard: Click "+ New" → "Web Service"
2. Select: Connect your GitHub repository → `IELTS`
3. Fill the form:
   - **Name:** `ielts-api`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 4 --timeout 60`
   - **Region:** Choose closest
   - **Plan:** Free tier

### 2.3: Set Environment Variables
1. In Render Web Service settings: Environment → Add Environment Variable

Add these variables:
```
DATABASE_URL = postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres
JWT_SECRET_KEY = (generate: openssl rand -hex 32)
FLASK_ENV = production
FLASK_DEBUG = 0
FRONTEND_BASE_URL = https://your-app.vercel.app
BACKEND_BASE_URL = https://ielts-api.onrender.com
ADMIN_APPROVER_EMAIL = admin@yourdomain.com
REQUIRE_LOGIN_APPROVAL = false
CLOUDINARY_CLOUD_NAME = (get from Cloudinary)
CLOUDINARY_API_KEY = (get from Cloudinary)
CLOUDINARY_API_SECRET = (get from Cloudinary)
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = (generate app password)
SMTP_FROM = noreply@yourdomain.com
```

**Generate JWT Secret:**
```bash
openssl rand -hex 32
# Output: copy this value
```

### 2.4: Deploy
1. Click "Create Web Service"
2. **Wait 5-10 minutes** for first deployment
3. Once deployed, you'll see a URL like: `https://ielts-api.onrender.com`

### 2.5: Test Backend
```bash
curl https://ielts-api.onrender.com/
# Should return: {"status": "ok", "service": "ielts-api"}
```

**Save:** Your backend URL (e.g., `https://ielts-api.onrender.com`)

---

## 3. Frontend Setup (Vercel)

### 3.1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 3.2: Import Project
1. In Vercel dashboard: "Add New" → "Project"
2. Select `IELTS` repository
3. Click "Import"

### 3.3: Configure Build
For **Framework Preset**, select "Vite"

Or manually set:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

### 3.4: Set Environment Variables
In Vercel Project Settings → Environment Variables:

```
VITE_API_URL = https://ielts-api.onrender.com
```

### 3.5: Deploy
1. Click "Deploy"
2. **Wait 2-3 minutes** for build
3. You'll get a URL like: `https://ielts-app.vercel.app`

### 3.6: Test Frontend
Open https://ielts-app.vercel.app in browser
- Should load without errors
- Try logging in
- Should connect to backend

**Save:** Your frontend URL (e.g., `https://ielts-app.vercel.app`)

---

## 4. Media Setup (Cloudinary)

### 4.1: Create Cloudinary Account
1. Go to https://cloudinary.com
2. Click "Sign Up Free"
3. Sign up with email or GitHub

### 4.2: Get API Credentials
1. In Cloudinary dashboard: Settings → API Keys
2. You'll find:
   - **Cloud Name** - copy this
   - **API Key** - copy this
   - **API Secret** - copy this

### 4.3: Update Render Environment Variables
Go back to Render → Your Web Service → Environment:

Update:
```
CLOUDINARY_CLOUD_NAME = your-cloud-name
CLOUDINARY_API_KEY = your-api-key
CLOUDINARY_API_SECRET = your-api-secret
```

**Redeploy** in Render after updating variables.

---

## 5. GitHub Secrets Setup

For auto-deployment workflows, add GitHub secrets to your repo:

### 5.1: Render Deploy Secret
1. Go to Render dashboard → Account Settings → API Keys
2. Create new API key → Copy it
3. In GitHub repo: Settings → Secrets and variables → Actions → New secret:
   - **Name:** `RENDER_API_KEY`
   - **Value:** Paste your API key

### 5.2: Get Render Service ID
1. In Render dashboard: Your Web Service URL bar has the service ID
2. URL format: `https://dashboard.render.com/web/srv-[SERVICE_ID]`
3. In GitHub Secrets, add:
   - **Name:** `RENDER_SERVICE_ID`
   - **Value:** `srv-xxxxxxxxxxxx`

### 5.3: Vercel Secrets
1. In Vercel: Account Settings → Tokens → Create Token
2. Create a new token with `Full Access` scope
3. In GitHub Secrets, add:
   - **Name:** `VERCEL_TOKEN`
   - **Value:** Paste the token

4. In Vercel dashboard, go to Project Settings:
   - **Name:** `VERCEL_ORG_ID`
   - **Value:** Your Vercel organization ID (in URL or settings)
   - **Name:** `VERCEL_PROJECT_ID`
   - **Value:** Your project ID (in project settings)

---

## 6. Auto-Deployment

With GitHub Secrets configured, push to `main` and:

- ✅ Backend changes → Auto-deploy to Render
- ✅ Frontend changes → Auto-deploy to Vercel
- ✅ Health checks run automatically

No manual deployment needed!

### Test Auto-Deployment:
1. Edit a file (e.g., change a comment in `app.py`)
2. Commit and push to `main`
3. Watch GitHub Actions (Actions tab)
4. Backend should deploy within 2-3 minutes
5. Check https://ielts-api.onrender.com (should have the date)

---

## 7. Troubleshooting

### Backend Shows "Service Unavailable"
**Solution:** 
1. In Render dashboard, check the service logs (Logs tab)
2. Common issues:
   - Missing `DATABASE_URL` env variable
   - Database not initialized
   - Port not bound correctly (should auto-use $PORT)

### Frontend Shows "Cannot reach API"
**Solution:**
1. Check browser console (F12 → Console)
2. Make sure `VITE_API_URL` is set in Vercel environment
3. Verify backend is running: `curl https://ielts-api.onrender.com/`
4. Redeploy frontend in Vercel

### Database Connection Failed
**Solution:**
1. Verify `DATABASE_URL` in Render environment:
   - Contains correct Supabase password
   - Connection string is complete
2. In Supabase dashboard, check if database is running
3. Try resetting password in Supabase and updating Render env

### Still Getting CORS Errors
**Solution:**
1. Backend CORS already configured for `all origins` in production
2. May be a timing issue - wait 60 seconds and refresh
3. Check browser Network tab - what status code is returned?

### Cold Start Takes Too Long
**Normal behavior** - Render's free tier spins down after 15 min of inactivity
- First request after 15 min: 30-60 seconds
- Subsequent requests: <1 second

---

## 📊 Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Your Browser (visited from anywhere)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Vercel CDN) - https://ielts-app.vercel.app        │
│ React SPA - globally cached                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Render) - https://ielts-api.onrender.com          │
│ Flask REST API - runs 24/7                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ Supabase DB      │      │ Cloudinary       │
│ (PostgreSQL)     │      │ (Media uploads)  │
│ Your data lives  │      │ Images/videos    │
│ here permanently │      │ stored globally  │
└──────────────────┘      └──────────────────┘
```

---

## ✅ Deployment Checklist

- [ ] Supabase project created + DATABASE_URL saved
- [ ] Render service created + environment variables set
- [ ] Backend health check passes (GET `/` returns 200)
- [ ] Vercel project connected + build succeeds
- [ ] Frontend loads in browser
- [ ] VITE_API_URL set correctly in Vercel
- [ ] Cloudinary credentials set in both frontend + backend
- [ ] GitHub Secrets configured for auto-deploy
- [ ] Tested auto-deployment (push → auto-deploy)
- [ ] Login works end-to-end
- [ ] File uploads work (tests Cloudinary)

---

## 🎯 Next Steps

1. **Monitor:** Enable Render alerts for uptime (free tier)
2. **Logging:** Check Render logs regularly for errors
3. **Backups:** Enable Supabase backups
4. **Custom Domain:** (Optional) Point your domain to Vercel
5. **Scale:** Upgrade from free tier when prod traffic increases

**You're live! 🎉**
