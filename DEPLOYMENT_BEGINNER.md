# 🚀 Complete Beginner's Deployment Guide

## What You're Deploying
- **Frontend** (React app you see in browser) → Cloudflare Pages
- **Backend** (Flask server that handles logic) → Fly.io  
- **Database** (where student data is stored) → Supabase

**Cost:** Completely FREE with these services

---

## ⏯️ PART 1: Local Testing (Do This First - No Account Needed)

### Step 1.1: Create `.env` file locally
```bash
cd /workspaces/IELTS
cp .env.example .env
```

### Step 1.2: Start the backend server (Terminal 1)
```bash
python app.py
```
You should see:
```
 * Running on http://127.0.0.1:5000
 * WARNING in app.py: This is a development server...
```

### Step 1.3: Start the frontend (Terminal 2)
```bash
npm run dev
```
You should see:
```
VITE v5.4.21  ready in 123 ms
➜  Local:   http://localhost:5173/
```

### Step 1.4: Test it works
Open browser: `http://localhost:5173`
- Should load the app
- No "Cannot reach backend API" error
- Try logging in

✅ **If this works, you're ready for production deployment**

---

## ⏯️ PART 2: Set Up Supabase (Database)

### What is Supabase?
It's a database hosting service. Your app data (students, plans, submissions) will be saved there instead of locally.

### Step 2.1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start Your Project" (top right)
3. Sign up with GitHub (easiest method)
4. Create new organization → give it a name like "IELTS-App"

### Step 2.2: Create a Database
1. Click "Create a new project"
2. Project name: `ielts-prod` 
3. Password: Use a strong one (copy it to a safe place)
4. Region: Choose closest to you
5. Click "Create new project"
6. **Wait 2-3 minutes** for it to initialize

### Step 2.3: Get Your Database URL
1. In Supabase, click your project → click "Settings" (bottom left)
2. Click "Database" in the left menu
3. Find "Connection string" section
4. Copy the URL that looks like: `postgresql://postgres:PASSWORD@[host]:[port]/postgres`
   - Replace `[YOUR-PASSWORD]` with the password you set earlier
5. **Save this URL somewhere safe** - you'll need it

### Step 2.4: Initialize database schema
In your terminal:
```bash
# Set this temporarily
export DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@[host]:[port]/postgres"

# Create all tables
python -c "from app import create_app; app = create_app('production'); print('✅ Database initialized')"
```

---

## ⏯️ PART 3: Deploy Backend to Fly.io

### What is Fly.io?
It's where your Flask backend runs 24/7. It's like renting a small computer in the cloud.

### Step 3.1: Create Fly.io Account
1. Go to https://fly.io
2. Click "Sign Up" (top right)
3. Sign up with GitHub (easiest)
4. No credit card needed for free tier

### Step 3.2: Install Fly CLI
```bash
# One command to install
curl -L https://fly.io/install.sh | sh

# Verify it worked
flyctl version
```

### Step 3.3: Login to Fly
```bash
flyctl auth login
# This will open a browser - follow the login steps
```

### Step 3.4: Create Fly App
```bash
cd /workspaces/IELTS

# Initialize a new Fly app
flyctl launch

# When asked:
# - App name: "ielts-app" (or your choice)
# - Region: Choose closest to you
# - Postgres: Choose "No" (we're using Supabase)
# - Deploy now: Choose "No" (we'll configure first)
```

### Step 3.5: Set Environment Variables on Fly
```bash
# Replace with YOUR actual values
flyctl secrets set \
  DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@[host]:[port]/postgres" \
  JWT_SECRET_KEY="your-secret-key-here" \
  BACKEND_BASE_URL="https://ielts-app.fly.dev" \
  FRONTEND_BASE_URL="https://your-frontend-url.pages.dev" \
  ADMIN_APPROVER_EMAIL="your-email@gmail.com" \
  FLASK_ENV="production"

# Verify they were set
flyctl secrets list
```

### Step 3.6: Deploy Backend
```bash
flyctl deploy

# Wait for it to finish... you should see:
# ✓ Image successfully pushed to registry
# ✓ Release v1 created and deployed
```

### Step 3.7: Test Backend is Live
```bash
# This should return {"status": "healthy"}
curl https://ielts-app.fly.dev/api/health
```

✅ **Backend is now live!**

---

## ⏯️ PART 4: Deploy Frontend to Cloudflare Pages

### What is Cloudflare Pages?
It's where your React website lives. When people visit your site, they see it hosted here.

### Step 4.1: Create Cloudflare Account
1. Go to https://cloudflare.com
2. Click "Sign up" (top right)
3. Use your email + password (or GitHub sign up)
4. No credit card needed for Pages

### Step 4.2: Add Your GitHub Repo to Cloudflare
1. In Cloudflare dashboard, find "Pages" (left sidebar)
2. Click "Create a project" → "Connect to Git"
3. Authorize Cloudflare to access your GitHub
4. Select your repository: `IELTS`
5. Click "Begin setup"

### Step 4.3: Configure Build Settings
When it asks for build config:
- **Framework preset:** React
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- Click "Save and Deploy"

### Step 4.4: Wait for Deployment
- Cloudflare will automatically build your app
- You'll see a URL like: `https://ielts-app.pages.dev`
- Wait for the build to finish (green checkmark)

### Step 4.5: Set Environment Variables
1. In Cloudflare Pages project settings
2. Click "Environment" (top)
3. Add variable: `VITE_API_BASE_URL` = `/api`
4. Redeploy (click the latest deployment → "Retry build")

✅ **Frontend is now live!**

---

## ⏯️ PART 5: Connect Everything Together

### Step 5.1: Update Backend URL in Dashboard
When you start your Fly app for the first time, it generates a URL. Update it:

```bash
# Get your backend URL
flyctl info

# You'll see something like:
# ielts-app.fly.dev
```

### Step 5.2: Test Everything Works
1. Open your frontend: `https://ielts-app.pages.dev`
2. Try logging in
3. Try creating a plan
4. Try submitting an assignment

If you see errors:
- Check Fly.io logs: `flyctl logs --app ielts-app`
- Check Cloudflare logs: Go to Pages project → scroll to "Build log"

---

## 🔧 Troubleshooting

### "Cannot reach backend API" error
**Solution:** Make sure Fly.io deployment finished successfully
```bash
flyctl deploy --remote
```

### "Invalid database password"  
**Solution:** Make sure you copied the DATABASE_URL correctly from Supabase (check password)
```bash
flyctl secrets set DATABASE_URL="postgresql://postgres:CORRECT-PASSWORD@..."
```

### "Frontend won't load"
**Solution:** Check Cloudflare Pages build log
- Go to Cloudflare Pages project
- Click "Deployments" tab
- Click the red X deployment
- Check the error message
- Usually it means `npm run build` failed

### "Authentication not working"
**Solution:** Make sure JWT_SECRET_KEY is set on Fly.io
```bash
flyctl secrets set JWT_SECRET_KEY="generate-a-random-string-here"
```

---

## 📋 Summary: What You Just Did

| Component | Location | Service |
|-----------|----------|---------|
| Database  | Cloud    | Supabase |
| Backend   | Cloud    | Fly.io  |
| Frontend  | Cloud    | Cloudflare Pages |
| Code      | Local    | GitHub  |

**Your app is now:**
- ✅ Accessible from anywhere in the world
- ✅ Running 24/7 (backend on Fly.io)
- ✅ Data is stored in Supabase (persistent)
- ✅ Frontend is cached globally (Cloudflare CDN)
- ✅ Completely FREE

---

## 🎯 Next Steps

1. **Go live:** Follow steps 1-5 in order
2. **Check deployment status:** Use the commands provided
3. **Run local tests** before deploying (Part 1)
4. **Ask me** if you get stuck on any step (show me the error)

Good luck! 🚀
