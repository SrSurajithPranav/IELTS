# Production Deployment Architecture & File Structure

## 📦 Final Project Structure

```
/IELTS (repository root)
│
├── 📂 .github/
│   └── workflows/
│       ├── deploy-backend.yml    ← Auto-deploy to Render on backend changes
│       ├── deploy-frontend.yml   ← Auto-deploy to Vercel on frontend changes
│       ├── ci.yml               ← Legacy CI workflow
│       └── deploy.yml           ← Legacy deploy workflow
│
├── 📂 src/                       ← Frontend React code
│   ├── App.jsx                  ← FIXED: Uses VITE_API_URL env var
│   ├── NewPages.jsx
│   ├── (other components)
│
├── 📂 routes/                    ← Backend route handlers
│   ├── ai.py
│   ├── auth.py
│   ├── plans.py
│   ├── (other routes)
│
├── 📂 models/                    ← Database models
│   ├── user.py
│   ├── db.py
│   ├── (other models)
│
├── 📂 utils/                     ← Utilities
│   ├── emailer.py
│   ├── scraper.py
│
│
├── 📄 app.py                     ← FIXED: Uses PORT env var
├── 📄 wsgi.py                    ← FIXED: Clean WSGI entry point (no if __name__)
├── 📄 config.py                  ← All env vars handled correctly
│
├── 📄 vite.config.js             ← OPTIMIZED: Production build settings
├── 📄 package.json               ← Frontend dependencies
├── 📄 package-lock.json
│
├── 📄 requirements.txt            ← CLEANED: Pinned versions only
│
├── 📄 Procfile                   ← CREATED: Render start command
├── 📄 vercel.json                ← CREATED: Vercel build config
│
├── .env                          ← Local dev (git ignored)
├── .env.example                  ← Template for repo maintainers
├── .env.backend.example          ← CREATED: Backend env vars
├── .env.frontend.example         ← CREATED: Frontend env vars
│
├── 📄 index.html                 ← Frontend entry point
├── 📄 .gitignore
│
├── 📚 Deployment Guides (all new):
│   ├── DEPLOYMENT_PRODUCTION.md          ← Full step-by-step guide
│   ├── DEPLOYMENT_VERIFICATION.md        ← Pre-deployment checklist
│   ├── QUICK_DEPLOYMENT_REFERENCE.md     ← Quick reference
│   ├── DEPLOYMENT_BEGINNER.md            ← Beginner guide (local)
│   └── DEPLOYMENT.md                     ← Original guide
│
├── README.md                    ← Project overview
└── (other files)
```

---

## 🎯 Deployment Ecosystem

### Production Infrastructure

```
                              ┌─────────────────────────────────────┐
                              │    GitHub Repository (Main Branch)  │
                              │  On Push → GitHub Actions Triggered │
                              └──────────────────────────────────────┘
                                              │
                              ┌───────────────┴──────────────┐
                              │                              │
                    Backend Changes               Frontend Changes
                              │                              │
                    ┌─────────▼────────┐          ┌────────▼──────────┐
                    │ deploy-backend   │          │ deploy-frontend  │
                    │  .yml workflow   │          │     .yml workflow│
                    └─────────┬────────┘          └────────┬─────────┘
                              │                           │
                    ┌─────────▼──────────────┐  ┌────────▼──────────────┐
                    │  Render.com            │  │  Vercel.com          │
                    │  Web Service: ielts-api│  │  Project: ielts-app │
                    │  Uses: wsgi.py         │  │  Uses: dist/ build   │
                    │  Env: DATABASE_URL     │  │  Env: VITE_API_URL   │
                    │  Port: $PORT (auto)    │  │  Build: npm run build│
                    │  Status: Running 24/7  │  │  Status: CDN cache   │
                    └─────────┬──────────────┘  └────────┬──────────────┘
                              │                          │
                              │ HTTPS API               │ HTTPS Frontend
                              │ https://ielts-api       │ https://ielts-app
                              │ .onrender.com           │ .vercel.app
                              │                          │
                              └───────────────┬──────────┘
                                              │
                              ┌───────────────┴──────────────────┐
                              │    Cross-Origin API Calls (CORS)│
                              │         (Backend enables all)   │
                              └───────────────┬──────────────────┘
                                              │
                              ┌───────────────┴──────────────────┐
                              │   Shared Data Layer              │
                              │                                  │
                ┌─────────────▼──────────────┐    ┌─────────────▼┐
                │  Supabase (PostgreSQL)     │    │ Cloudinary  │
                │  DATABASE_URL passed from  │    │ (Media)     │
                │  Render environment        │    │             │
                │  Backups: Automatic        │    │ CDN Global  │
                └────────────────────────────┘    └─────────────┘
```

---

## 🔐 Environment Variables Flow

### Render (Backend)
```
Render Dashboard Environment Variables:
├── DATABASE_URL              → PostgreSQL from Supabase
├── JWT_SECRET_KEY            → Generated (openssl rand -hex 32)
├── FLASK_ENV                 → "production"
├── FLASK_DEBUG               → "0"
├── FRONTEND_BASE_URL         → https://ielts-app.vercel.app
├── BACKEND_BASE_URL          → https://ielts-api.onrender.com
├── CLOUDINARY_CLOUD_NAME     → From Cloudinary API Key
├── CLOUDINARY_API_KEY        → From Cloudinary API Key
├── CLOUDINARY_API_SECRET     → From Cloudinary API Key
├── ADMIN_APPROVER_EMAIL      → admin@domain.com
├── SMTP_*                    → Email service creds
└── REQUIRE_LOGIN_APPROVAL    → "true" or "false"

Code reads via:
├── config.py: os.getenv('DATABASE_URL', fallback)
├── The database URL is used in create_app()
└── All values used client-side in route handlers
```

### Vercel (Frontend)
```
Vercel Dashboard Environment Variables:
├── VITE_API_URL → https://ielts-api.onrender.com

Code reads via:
├── vite.config.js: import.meta.env.VITE_API_URL
├── src/App.jsx determines final API_BASE_URL
└── All API calls use this URL base
```

---

## 🔄 Request/Response Flow

### User Login Flow (Complete Path)
```
1. Browser: https://ielts-app.vercel.app
   ├─ Loads from Vercel's global CDN
   ├─ React app initializes in browser
   └─ JavaScript reads VITE_API_URL from build (production set as https://ielts-api.onrender.com)

2. User clicks: Login button
   ├─ Frontend: POST to https://ielts-api.onrender.com/api/auth/login
   ├─ Render backend receives request
   ├─ CORS check: Backend allows all origins (Flask-CORS)
   └─ Database query: SELECT * from user WHERE email = ?

3. Database query goes to Supabase
   ├─ Query hits PostgreSQL via DATABASE_URL
   └─ Result returned to Render backend

4. Render backend processes auth
   ├─ Password hash verified
   ├─ JWT token generated using JWT_SECRET_KEY
   ├─ Response sent back to browser

5. Browser receives response
   ├─ Frontend stores JWT in localStorage
   ├─ Subsequent requests include Authorization header
   └─ User sees dashboard
```

---

## 📋 Critical Configuration Files

### 1. **wsgi.py** (Entry Point for Gunicorn)
```python
# Clean - Gunicorn reads this directly
import os
from app import create_app

config_name = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name)
# No if __name__ == '__main__' - this breaks Gunicorn
```

### 2. **Procfile** (Render Start Command)
```
web: gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 4 --timeout 60 ...
```
- `wsgi:app` = module:variable (Python WSGI standard)
- `$PORT` = Render injects this automatically (usually 10000)
- `workers 4` = Gunicorn processes for concurrency
- `timeout 60` = Kill hung requests after 60s

### 3. **vercel.json** (Vercel Build)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```
- Tells Vercel: "Build React, output goes to dist/"
- Rewrites: SPA routing (all routes except /api/* go to index.html)

### 4. **vite.config.js** (Frontend Build)
```javascript
build: {
  target: 'es2020',
  minify: 'terser',
  sourcemap: false,
  outDir: 'dist'
}
```
- Minified, no source maps (production)
- Output to `dist/` (Vercel expects this)

---

## 🚀 Deployment Sequence

### First-Time Deployment (Manual)
```
1. Create Supabase account → Get DATABASE_URL (10 min)
   
2. Create Render Web Service
   ├─ Connect GitHub repo
   ├─ Set Build: pip install -r requirements.txt
   ├─ Set Start: gunicorn wsgi:app --bind 0.0.0.0:$PORT ...
   ├─ Add all env variables
   └─ Deploy (5-10 min)

3. Create Vercel Project
   ├─ Connect GitHub repo
   ├─ Set Build: npm run build
   ├─ Set Output: dist
   ├─ Add VITE_API_URL = https://ielts-api.onrender.com
   └─ Deploy (2-3 min)

4. Setup GitHub Secrets (for auto-deploy)
   ├─ RENDER_API_KEY, RENDER_SERVICE_ID
   ├─ VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
   └─ GitHub will auto-inject into workflows
```

### Subsequent Deployments (Automatic)
```
Developer: git push origin main
    ↓
GitHub detects push to main
    ↓
GitHub Actions trigger (if files changed)
    ├─ Backend changes? → deploy-backend.yml runs
    │  └─ Calls Render API → Service redeploys
    │
    └─ Frontend changes? → deploy-frontend.yml runs
       └─ Calls Vercel API → Rebuilds & deploys

Result: Deployed automatically in 2-5 minutes
```

---

## 🔍 Key Production Changes

### What Changed from Development
| Item | Dev | Prod |
|------|-----|------|
| **Port** | Hardcoded 5000 | Environment variable $PORT |
| **Debug** | `FLASK_DEBUG=1` | `FLASK_DEBUG=0` |
| **Database** | SQLite (local file) | Supabase PostgreSQL |
| **API Base** | localhost:5000 | Render URL (https) |
| **CORS** | Configured for dev | `cors(app, resources={r"/api/*": {"origins": "*"}})` |
| **Frontend Build** | Dev server proxy | Vite static build |
| **Deployment** | Manual | Git push auto-deploys |
| **Secrets** | `.env` file | Platform env vars |

---

## ✅ Pre-Production Verification

Run these before pushing to production:

```bash
# Backend
python app.py  # Runs on http://localhost:5000
gunicorn wsgi:app --bind 0.0.0.0:5000  # Runs exactly like Render

# Frontend
npm run dev    # Dev server works
npm run build  # Build succeeds, no errors
ls dist/       # Verify dist/ exists with index.html

# Verify no secrets in code
grep -r "localhost:5000" src/  # Should be empty
grep -r "sk_" .                 # Should not find Stripe keys etc
grep -r "api_key" . --include="*.py" --include="*.jsx"  # Should be env vars only
```

---

## 📞 Support Links

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Flask Deployment:** https://flask.palletsprojects.com/deployment/

---

## 🎯 Next Milestone: Custom Domain

After deployment works, optionally add custom domain:
1. Update `BACKEND_BASE_URL` in Render env
2. Update `FRONTEND_BASE_URL` in Render env  
3. Update `VITE_API_URL` in Vercel env
4. Domain DNS → Points to service
5. Redeploy both

---

**Status: PRODUCTION READY ✅**

All code is ready. Start with the steps in `DEPLOYMENT_PRODUCTION.md`
