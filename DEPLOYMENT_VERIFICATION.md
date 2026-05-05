# Production Deployment Verification Checklist

This checklist ensures your IELTS app is production-ready across all backends.

## Pre-Deployment (Local)

### Backend Verification
- [ ] `python app.py` starts without errors
- [ ] Health check works: `curl http://localhost:5000/`
- [ ] API endpoints respond: `curl http://localhost:5000/api/health`
- [ ] No hardcoded secrets in `app.py`, `config.py`, or route files
- [ ] All environment variables use `os.getenv()` with defaults
- [ ] Database connection test passes locally
- [ ] `gunicorn wsgi:app` runs successfully
- [ ] No errors in `requirements.txt` dependencies

### Frontend Verification
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully with no errors
- [ ] Output is in `dist/` directory with `index.html`
- [ ] No hardcoded `localhost:5000` references
- [ ] API calls use `VITE_API_URL` environment variable
- [ ] Works in production mode: verify `dist/` contents

### Environment Files
- [ ] `.env.backend.example` contains all required variables
- [ ] `.env.frontend.example` contains VITE_API_URL
- [ ] `.env.example` (root) has both frontend and backend vars
- [ ] No secrets in any `.example` files (only placeholders)

### Configuration Files
- [ ] `Procfile` exists with correct Gunicorn command
- [ ] `vercel.json` configured with build/output/rewrites
- [ ] `vite.config.js` optimized for production build
- [ ] `wsgi.py` has no `if __name__ == '__main__'` block

### Deployment Files
- [ ] `requirements.txt` pinned to specific versions (no `>=`)
- [ ] All production dependencies included in `requirements.txt`
- [ ] `package.json` has all frontend dependencies
- [ ] `.github/workflows/deploy-backend.yml` created
- [ ] `.github/workflows/deploy-frontend.yml` created

---

## Render Backend Deployment

### Render Configuration
- [ ] Render account created and logged in
- [ ] Web Service created with repository connected
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 4 --timeout 60`
- [ ] Region selected (closest to your users)
- [ ] Free tier selected (no credit card charged)

### Environment Variables (Render)
- [ ] `DATABASE_URL` - PostgreSQL connection string from Supabase
- [ ] `JWT_SECRET_KEY` - Generated securely (32 hex chars)
- [ ] `FLASK_ENV` - Set to `production`
- [ ] `FLASK_DEBUG` - Set to `0`
- [ ] `FRONTEND_BASE_URL` - HTTPS URL of Vercel frontend
- [ ] `BACKEND_BASE_URL` - Your Render service URL
- [ ] `CLOUDINARY_*` - All three Cloudinary credentials
- [ ] `ADMIN_APPROVER_EMAIL` - Your email
- [ ] `SMTP_*` - Email service credentials (or set to empty string to disable)

### Render Deployment
- [ ] Service deployed successfully (no "build failed" status)
- [ ] Service URL generated (e.g., `https://ielts-api.onrender.com`)
- [ ] Health check passes: `curl https://ielts-api.onrender.com/`
- [ ] API health check works: `curl https://ielts-api.onrender.com/api/health`
- [ ] Logs show no error messages

---

## Vercel Frontend Deployment

### Vercel Configuration
- [ ] Vercel account created and logged in
- [ ] GitHub repository connected
- [ ] Project imported successfully
- [ ] Framework: Vite (auto-detected or manually set)
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### Environment Variables (Vercel)
- [ ] `VITE_API_URL` - Set to your Render backend URL (https://ielts-api.onrender.com)
- [ ] No hardcoded localhost values

### Vercel Deployment
- [ ] Build completed successfully (no warnings about build errors)
- [ ] Deployment shows "Ready" status
- [ ] Frontend URL generated (e.g., `https://ielts-app.vercel.app`)
- [ ] Site loads without blank page
- [ ] Navigation works
- [ ] API calls resolve (check browser Network tab)

---

## Supabase Database

### Supabase Setup
- [ ] Project created
- [ ] Database password set securely
- [ ] Connection string copied correctly
- [ ] PostgreSQL version is 14+
- [ ] Region matches your expected location

### Database Initialization
- [ ] Schema initialized (all tables created)
- [ ] Sample data inserted (if needed)
- [ ] Backups enabled (automatic)
- [ ] Database role `postgres` has correct password

---

## Cloudinary Media

### Cloudinary Setup
- [ ] Account created
- [ ] API credentials copied:
  - Cloud Name
  - API Key
  - API Secret
- [ ] Credentials saved in Render environment
- [ ] Credentials saved in Vercel environment (if needed frontend-side)
- [ ] Test upload works through API

---

## GitHub Actions CI/CD

### GitHub Secrets
- [ ] RENDER_API_KEY - API token for Render
- [ ] RENDER_SERVICE_ID - Your render service ID
- [ ] VERCEL_TOKEN - API token for Vercel
- [ ] VERCEL_ORG_ID - Your Vercel organization ID
- [ ] VERCEL_PROJECT_ID - Your Vercel project ID

### Workflows
- [ ] `.github/workflows/deploy-backend.yml` triggers on push to main with backend changes
- [ ] `.github/workflows/deploy-frontend.yml` triggers on push to main with frontend changes
- [ ] Test workflow by modifying a backend or frontend file and pushing
- [ ] Actions complete without errors
- [ ] Rendering deploys within 3 minutes
- [ ] Vercel builds within 2 minutes

---

## End-to-End Testing

### Functionality
- [ ] Frontend loads without errors
- [ ] Login page displays
- [ ] Can submit login credentials
- [ ] API returns auth response (check Network tab)
- [ ] Dashboard loads after login
- [ ] Can create/edit items (plans, tasks, etc.)
- [ ] File uploads work (tests Cloudinary integration)
- [ ] API calls include JWT authentication header
- [ ] Real-time updates work (if applicable)

### Performance
- [ ] Frontend page load time < 3 seconds
- [ ] API responses < 1 second (excluding cold starts)
- [ ] No CORS errors in browser console
- [ ] No 404 errors for assets

### Security
- [ ] All API calls use HTTPS
- [ ] Sensitive data not logged in Render logs
- [ ] JWT tokens not exposed in frontend code
- [ ] Database credentials not committed to Git
- [ ] API keys isolated to environment variables only

---

## Post-Deployment Monitoring

### Logging & Alerts
- [ ] Enable Render alerts for service downtime
- [ ] Periodic health checks configured
- [ ] Error emails enabled
- [ ] Database performance monitored

### Maintenance
- [ ] Document deployment steps for team
- [ ] Set password rotation reminder
- [ ] Plan database maintenance windows
- [ ] Regular backups verified in Supabase

---

## Rollback Procedures

- [ ] Document previous working version hash
- [ ] Know how to revert Vercel deployment (Deployments tab)
- [ ] Know how to revert Render deployment (Deploys tab)
- [ ] Have database backup procedure documented
- [ ] Test rollback procedure in staging first

---

## Final Sign-Off

- [ ] All items above checked
- [ ] Tested with multiple browsers
- [ ] Tested from different networks/locations
- [ ] Team is trained on deployment process
- [ ] Runbook documented and shared

**Status: READY FOR PRODUCTION** ✅

**Deployed:** [DATE]
**Deployed By:** [NAME]
**Version:** [GIT COMMIT HASH]
