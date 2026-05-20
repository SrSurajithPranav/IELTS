# GitHub / Render / Vercel Environment Setup

Use this as the source of truth for deployment secrets and runtime environment variables.

## Copy-Paste Templates

### Render service environment variables

Use these exact keys in Render → Environment:

```env
DATABASE_URL=postgresql://postgres.bahzxbkmhzmokofejiyo:5yeck%25J7pyg%2Fmk8%40aws@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
JWT_SECRET_KEY=generate-a-long-random-secret
FLASK_ENV=production
FLASK_DEBUG=0
REQUIRE_LOGIN_APPROVAL=false
FRONTEND_BASE_URL=https://your-frontend.vercel.app
BACKEND_BASE_URL=https://your-backend.onrender.com
ADMIN_APPROVER_EMAIL=admin@yourdomain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=IELTS Platform <your-email@gmail.com>
PYTHON_VERSION=3.11.9
```

### Local backend `.env`

Use this for local development:

```env
FLASK_ENV=development
FLASK_APP=app.py
DATABASE_URL=sqlite:///ielts.db
JWT_SECRET_KEY=change-me-in-local-dev
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
REQUIRE_LOGIN_APPROVAL=true
ADMIN_APPROVER_EMAIL=srsurajith@gmail.com
FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=IELTS Platform <your-email@gmail.com>
```

### Frontend `.env`

Use this in Vercel or local frontend env files:

```env
VITE_API_URL=https://your-backend.onrender.com
```

## GitHub Secrets for Auto-Deploy Workflows

Add these in GitHub repository settings → Secrets and variables → Actions:

### Render deploy workflow
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`
- `RENDER_HEALTH_CHECK_URL`

### Vercel deploy workflow
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Render Runtime Environment Variables

Add these in Render service settings → Environment:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `REQUIRE_LOGIN_APPROVAL=false`
- `FRONTEND_BASE_URL`
- `BACKEND_BASE_URL`
- `ADMIN_APPROVER_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `PYTHON_VERSION=3.11.9`

## Vercel Runtime Environment Variable

Add this in Vercel project settings → Environment Variables:

- `VITE_API_URL`

## Values to Copy Carefully

- `DATABASE_URL` must be the exact Supabase Postgres URL.
- If the password contains special characters, URL-encode them.
- If the URL is for Supabase, keep `sslmode=require` at the end of the URL.
- If Render shows `tenant/user ... not found`, the Supabase pooler username/host pair is wrong or was copied from the wrong project.
- `VITE_API_URL` must point to the Render service URL and must not end with a trailing slash.
