# ⚡ Deploy in 15 Minutes (Quick Start)

**This is the fastest path to production. Follow exactly.**

---

## Step 1: Create Database (3 min)

```bash
# Go to https://supabase.com
# Click "Start Your Project" → Sign up with GitHub
# Create project: name=ielts-prod, password=anything
# Wait 3 minutes...
# When done, go to Settings → Database
# Copy the connection string (it looks like postgresql://...)
# Replace [PASSWORD] with your password

# RESULT: You'll have DATABASE_URL like:
# postgresql://postgres:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

---

## Step 2: Deploy Backend (5 min)

```bash
# Go to https://render.com → Sign in with GitHub
# Click "+ New" → "Web Service"
# Select your IELTS repo
# Fill the form:
#   Name: ielts-api
#   Environment: Python 3
#   Build Command: pip install -r requirements.txt
#   Start Command: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 4 --timeout 60
#   Plan: Free
# Click "Create Web Service"

# While it deploys (5 min), get your JWT secret:
openssl rand -hex 32
# Copy this output
```

### Add Environment Variables to Render:
In Render dashboard, go to your new service → Environment → Add variable:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@[HOST]:[PORT]/postgres
JWT_SECRET_KEY=<paste the output from openssl command>
FLASK_ENV=production
FLASK_DEBUG=0
FRONTEND_BASE_URL=https://your-app.vercel.app (you'll update this later)
BACKEND_BASE_URL=https://ielts-api.onrender.com
ADMIN_APPROVER_EMAIL=your-email@gmail.com
REQUIRE_LOGIN_APPROVAL=false
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Once deployed, test:
```bash
# Should return {"status": "ok", ...}
curl https://ielts-api.onrender.com/
```

**RESULT: Backend is live at https://ielts-api.onrender.com**

---

## Step 3: Deploy Frontend (5 min)

```bash
# Go to https://vercel.com → Sign in with GitHub
# Click "Add New" → "Project"
# Select IELTS repository
# Framework: Vercel auto-detects "Vite" → click it
# Click "Deploy"
# Wait 2-3 minutes...
```

### Add Environment Variable to Vercel:
In Vercel dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://ielts-api.onrender.com
```

Redeploy:
```bash
# In Vercel, click latest deployment → "Redeploy"
# Wait 1 minute
```

**RESULT: Frontend is live at https://ielts-app.vercel.app**

---

## Step 4: GitHub Auto-Deploy (2 min)

To make future deploys automatic on `git push main`:

### Get Render API Key:
```bash
# Render → Account Settings → API Keys
# Create API Key → copy it
```

Add to GitHub Secrets:
```bash
cd /workspaces/IELTS
# In GitHub repo → Settings → Secrets → "New repository secret"
# Add:
#   Name: RENDER_API_KEY
#   Value: paste your Render API key
```

Find your Render Service ID:
```bash
# In Render dashboard, your service URL has this format:
# https://dashboard.render.com/web/srv-xxxxxxxxxxxx
# Copy the srv-xxxxxxxxxxxx part
# In GitHub Secrets, add:
#   Name: RENDER_SERVICE_ID
#   Value: srv-xxxxxxxxxxxx
```

### Get Vercel API Token:
```bash
# Vercel → Account Settings → Tokens
# Create token → copy it
# GitHub Secrets → Add:
#   Name: VERCEL_TOKEN
#   Value: paste token
```

Get Vercel IDs:
```bash
# Vercel → Project Settings
# Get: VERCEL_ORG_ID (your org ID)
# Get: VERCEL_PROJECT_ID (in project settings)
# GitHub Secrets → Add both
```

### Test Auto-Deploy:
```bash
cd /workspaces/IELTS
# Edit something (e.g., add a comment to app.py)
git add -A
git commit -m "test: trigger auto-deploy"
git push origin main

# In GitHub → Actions → watch deployment run
# After 5-10 minutes, your changes should be live!
```

---

## ✅ You're Done! Your app is now:
- ✅ **Frontend** accessible worldwide
- ✅ **Backend** running 24/7
- ✅ **Database** storing data permanently
- ✅ **Auto-deploys** on every git push
- ✅ **Completely free** forever

---

## 🎯 Test Your Deployment

```bash
# Open in browser:
https://ielts-app.vercel.app

# Try:
# 1. Load the app (should show landing page)
# 2. Navigate around
# 3. Try to login (should hit your backend)
# 4. Check browser Network tab (F12) - API calls should go to onrender.com
```

---

## 🚨 If Something Breaks

| Issue | Fix |
|-------|-----|
| "Cannot reach API" | Check VITE_API_URL in Vercel matches Render URL |
| "Database error" | Check DATABASE_URL is exactly right in Render env |
| "502 Bad Gateway" | Check Render logs - usually cold start, wait 60 sec |
| "Build failed" | Check logs in GitHub Actions or Vercel |

---

## 📚 For More Details

- **Full guide:** See `DEPLOYMENT_PRODUCTION.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Checklist:** See `DEPLOYMENT_VERIFICATION.md`

---

## 📞 Support

All three platforms have 24/7 docs:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

**You got this! 🚀**
