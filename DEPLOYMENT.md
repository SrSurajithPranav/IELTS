Deployment guide — Supabase (Postgres/Auth) + Fly.io (backend) + Cloudflare Pages (frontend)
=============================================================================

Overview
--------
This project can be deployed with a dynamic stack:
- Supabase: Postgres database, Auth, Storage, Realtime (free tier available)
- Fly.io: host the Flask backend container (free tier available)
- Cloudflare Pages: host the React frontend (free)

High-level steps
-----------------
1. Create a Supabase project. Note the `DATABASE_URL` (Postgres) and create a service role / API key.
2. Configure environment variables on Fly.io (see `fly.toml.sample`).
3. Build and push the backend Docker image and deploy with Fly.io using `flyctl`.
4. Build the frontend (`npm run build`) and deploy to Cloudflare Pages. Set `VITE_API_URL` to your backend URL.

Files added
-----------
- `wsgi.py` — WSGI entrypoint for Gunicorn.
- `Dockerfile` — containerizes the Flask backend.
- `requirements.txt` — Python dependencies.
- `fly.toml.sample` — sample Fly.io config.

Fly.io quick deploy
-------------------
Install `flyctl` and log in.

1. Create app and Postgres (or use Supabase DB):

```bash
flyctl launch --name ielts-app --region ord
# Or create app interactively and then run: flyctl postgres create
```

2. Set secrets from Supabase / your environment:

```bash
flyctl secrets set DATABASE_URL="<your_database_url>" JWT_SECRET_KEY="<jwt_secret>" ADMIN_APPROVER_EMAIL="you@example.com" FRONTEND_BASE_URL="https://your-pages.example"
```

3. Deploy:

```bash
docker build -t ielts-app .
flyctl deploy --image ielts-app
```

Cloudflare Pages (frontend)
---------------------------
1. Create a new Pages project and connect your GitHub repo.
2. Set build command: `npm run build` and publish directory: `dist`.
3. Add environment variable `VITE_API_URL` pointing to your backend URL (e.g. `https://ielts-app.fly.dev/api`).

Supabase notes
--------------
- Use Supabase Auth if you want managed user registration and OAuth. You can keep the existing Flask auth or migrate to Supabase Auth.
- Use Supabase Storage for media (recordings) and point `CLOUDINARY_*` env vars or switch to Supabase Storage in code.
- For search/AI embedding storage, consider Supabase Vector extension.

Security
--------
- Never store secrets in the repo — use Fly.io secrets and Cloudflare environment variables.
- Rotate JWT secret and DB passwords before production.

Next steps I can do for you
--------------------------
1. Create `Dockerfile`, `wsgi.py` (done) and test build locally.
2. Generate `flyctl` deploy commands and CI (GitHub Actions) to auto-deploy on push.
3. Add Supabase integration code (optional): replace local DB with Supabase Postgres and wire Supabase Auth.

GitHub Actions secrets required
-------------------------------
For the deploy workflow in `.github/workflows/deploy.yml`, add these secrets in your GitHub repo:

- `FLY_API_TOKEN` — from `fly auth token`
- `FLY_APP_NAME` — your Fly app name
- `CLOUDFLARE_API_TOKEN` — Cloudflare Pages deploy token
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
- `CLOUDFLARE_PAGES_PROJECT_NAME` — your Pages project name
- `VITE_API_URL` — your live backend URL, e.g. `https://your-backend.fly.dev/api`

What I still need from you
--------------------------
I can fully deploy both sides as soon as you share:

1. Your Fly.io app name, or permission to create one.
2. A Fly.io API token (`FLY_API_TOKEN`) or confirmation you want to run `fly auth login` locally.
3. Your Cloudflare Pages project name and account ID, or permission to create them.
4. A Cloudflare API token with Pages deploy permission.

Without those credentials I can only prepare the repo and the deploy automation, not complete the external deployment itself.
