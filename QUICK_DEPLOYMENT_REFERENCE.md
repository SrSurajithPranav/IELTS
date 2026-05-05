# 🚀 Quick Deployment Reference

**Use this file as a quick checklist - full details in `DEPLOYMENT_PRODUCTION.md`**

## Single Command Deployment Overview

```
Your Laptop (git push main)
    ↓
GitHub Actions Workflows (auto-triggered)
    ├─ deploy-backend.yml → Render API deployment
    └─ deploy-frontend.yml → Vercel app deployment
```

---

## 📊 Architecture Summary

| Component | Service | URL | Cost |
|-----------|---------|-----|------|
| Database | Supabase | N/A | Free |
| Backend | Render | https://ielts-api.onrender.com | Free |
| Frontend | Vercel | https://ielts-app.vercel.app | Free |
| Media | Cloudinary | (embedded) | Free |

---

## 🔧 Manual Deployment (First Time Only)

### 1. Supabase Database (5 min)
```
supabase.com → Create Project → Copy DATABASE_URL
```

### 2. Render Backend (10 min)
```
render.com → Connect GitHub → Add Environment Variables → Deploy
Start Command: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 4 --timeout 60
```

### 3. Vercel Frontend (5 min)
```
vercel.com → Import GitHub Repo → Build Success → Live
```

### 4. Cloudinary Media (2 min)
```
cloudinary.com → Get API Keys → Copy to Render environment variables
```

---

## 🤖 Auto-Deployment (After First Time)

### GitHub Secrets Setup (One-time)
- `RENDER_API_KEY` - from Render Account Settings
- `RENDER_SERVICE_ID` - from your Render service URL
- `VERCEL_TOKEN` - from Vercel Account Settings
- `VERCEL_ORG_ID` - from Vercel organization
- `VERCEL_PROJECT_ID` - from Vercel project settings

**Then:** Simply push code to `main` - auto-deploys!

```bash
git add .
git commit -m "feat: description"
git push origin main
# ✓ Backend auto-deploys in 3 min
# ✓ Frontend auto-deploys in 2 min
```

---

## 🐛 Debugging

### Backend Not Responding
```bash
# Check Render logs
curl https://ielts-api.onrender.com/
```

### Frontend Shows "Cannot reach API"
```bash
# Check if VITE_API_URL is set correctly in Vercel
# Browser Console (F12) → Network tab → check failed requests
```

### "Cold Start" (First Request Slow)
```
Normal - Free tier sleeps after 15 min inactivity
First request: 30-60s
Subsequent: <1s
```

---

## 📁 New/Modified Files

### Backend
- **wsgi.py** - WSGI entry point (no `if __name__` now)
- **Procfile** - Render deployment config
- **.env.backend.example** - All env vars needed
- **requirements.txt** - Cleaned + pinned versions

### Frontend
- **vercel.json** - Vercel build config
- **.env.frontend.example** - VITE_API_URL reference
- **vite.config.js** - Production optimization
- **src/App.jsx** - Uses VITE_API_URL from env

### CI/CD
- **.github/workflows/deploy-backend.yml** - Auto-deploy to Render
- **.github/workflows/deploy-frontend.yml** - Auto-deploy to Vercel

### Docs
- **DEPLOYMENT_PRODUCTION.md** - Full step-by-step guide
- **DEPLOYMENT_VERIFICATION.md** - Pre-deployment checklist
- **QUICK_DEPLOYMENT_REFERENCE.md** - This file

---

## ⚡ Essential Commands

### Generate JWT Secret (for Render env)
```bash
openssl rand -hex 32
```

### Test Backend Locally
```bash
python app.py
# Should start on http://127.0.0.1:5000
```

### Build Frontend Locally
```bash
npm run build
# Should create ./dist folder
```

### Test with Render Command
```bash
gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 4 --timeout 60
# Should start exactly like Render will
```

---

## ✅ Quick Checklist Before Push

- [ ] Backend started locally works: `python app.py`
- [ ] Frontend builds: `npm run build`
- [ ] Backend builds with gunicorn command
- [ ] All env vars in Render set correctly
- [ ] VITE_API_URL set in Vercel
- [ ] If deploying new env vars: restart Render service manually first
- [ ] Push to `main` branch (workflows only trigger on main)

---

## 🎯 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot reach backend API" | VITE_API_URL not set in Vercel | Set env var, redeploy |
| "Service Unavailable" (502) | Backend crashed | Check Render logs |
| "Build failed" on Vercel | npm run build error | Check build logs, fix locally |
| "Could not connect to database" | DATABASE_URL wrong | Verify in Supabase → copy exact |
| "Module not found" | Missing in requirements.txt | Add + redeploy Render |

---

## 📞 Need Help?

1. **Frontend issues?** Check browser console (F12) → Console tab
2. **Backend issues?** Check Render logs (Dashboard → App → Logs)
3. **Database issues?** Check Supabase (Dashboard → SQL Editor)
4. **Build issues?** Check GitHub Actions (Repo → Actions tab)

---

## 🎉 It's Deployed!

Your app is now:
- ✅ Hosted globally (Vercel CDN)
- ✅ Running 24/7 (Render backend)
- ✅ Auto-deploys on git push
- ✅ Completely free
- ✅ Production-ready

**Next:** Monitor logs regularly, set up alerts, plan scaling.
