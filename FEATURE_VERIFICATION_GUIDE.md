# Feature Verification & Step-by-step Checks

This document describes the key features added/changed and step-by-step instructions to verify them through the frontend locally.

Prerequisites
- Backend: run the development Socket.IO-enabled Flask server:
  - Activate venv: `source venv/bin/activate`
  - Start server (dev): `python run_socketio.py` or run the provided inline runner (allow_unsafe_werkzeug=True).
- Frontend: install deps and run Vite dev server:
  - `npm install`
  - `npm run dev`

Checks
1) Admin login
  - Open the frontend at http://localhost:5173
  - Use admin credentials seeded by `scripts/seed_users.py` (or create via API) to log in.
  - Confirm dashboard loads and you see admin navigation items.

2) Teacher access to students page
  - Log in as a teacher account.
  - Open the `Students` admin page (Sidebar → Students).
  - Confirm you can view/manage students (list page loads without 403).

3) Job Tokens (Admin)
  - As admin, open Job Tokens (Sidebar → Job Tokens).
  - Create a token (name, days). A modal shows the secret; copy it and store it.
  - Confirm the tokens list shows entries (masked, no plaintext token). Deleting tokens works.

4) Review Audits + CSV export (Admin)
  - Open Review Audits page (Sidebar → Review).
  - Use filters (creator id, student id, category, date range) and click Apply Filters.
  - Confirm results change accordingly and Export CSV downloads filtered data.

5) Notifications (Realtime)
  - Start backend (Socket.IO) and frontend dev server.
  - Log in as any user in browser; open Notification Center.
  - Trigger a notification via backend curl or script (e.g., call push_notification in shell). The notification should appear in the UI in real time.

6) Seed script
  - Run `python scripts/seed_users.py` (idempotent) to create admin/teacher/student accounts.

Notes & Next Steps
- For production, remove dev fallbacks for `JWT_SECRET_KEY` and run Socket.IO with a production-ready server (eventlet/uwsgi+gevent).
- The server is intentionally not returning job token plaintext in listing — only on creation.
- If frontend build fails, clear Vite cache: stop server, remove `node_modules/.vite`, then `npm run dev`.

If you want, I can commit these changes and push them to `main`, then run the frontend dev server and report back the build output.
# IELTS Feature Verification Guide

This guide lists the main features that are currently implemented and the exact frontend steps to check them.

## 1. Start the app locally

Backend:
```bash
source venv/bin/activate
python - <<'PY'
from app import create_app
from extensions import socketio
app = create_app('development')
socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)
PY
```

Frontend:
```bash
npm run dev
```

Open the app in the browser at `http://localhost:5173`.

## 2. Test credentials

Seeded accounts:
- Admin: `admin@test.com` / `admin123`
- Teacher: `teacher1@test.com` / `teacher123`
- Student: `student1@test.com` / `student123`
- Student: `student2@test.com` / `student234`

If you need to re-seed them:
```bash
source venv/bin/activate
python scripts/seed_users.py
```

## 3. Frontend checks by role

### Admin checks
1. Log in as admin.
2. Open `Overview` and verify counts load.
3. Open `Students` and verify the list appears.
4. Open a student profile and use `Create Review Drill`.
5. Open `Audits` and confirm review audit rows load.
6. Use `Export CSV` and confirm the file downloads.
7. Open `Job Tokens` and create a token.
8. Copy the token from the secret modal, then close it.

### Teacher checks
1. Log in as teacher.
2. Open `Students`.
3. Verify the student list opens without a permission error.
4. Create or reset a student password if needed.

### Student checks
1. Log in as student.
2. Open `Dashboard`.
3. Open the notification bell.
4. Trigger a notification from the backend and confirm it appears live.
5. Open `Review Mistakes` and verify drills load.

## 4. End-to-end feature checklist

### Authentication
1. Log in as admin.
2. Log out.
3. Log in as teacher.
4. Log out.
5. Log in as student.

### Student management
1. As teacher or admin, open `Students`.
2. Confirm the list renders.
3. Add or reset a student.

### Review drill flow
1. As student, answer a quiz incorrectly.
2. Return to the dashboard.
3. Open `Review Mistakes`.
4. Confirm targeted drills are generated.
5. As admin, create a bulk review quiz from `Students`.

### Notifications
1. Open a student account.
2. Leave the notification bell open.
3. Trigger a backend notification using a script or admin flow.
4. Confirm it appears live without refresh.

### Job tokens
1. Open admin `Job Tokens`.
2. Create a token.
3. Copy the token from the one-time secret modal.
4. Use it with the scheduled generator script.

### Audit reports
1. Open admin `Audits`.
2. Filter by creator, student, category, or date.
3. Export CSV.
4. Open the CSV to verify the rows match the filters.

## 5. Manual API checks that support frontend behavior

Admin login:
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' | jq
```

Teacher student list:
```bash
TEACHER_TOKEN=<token>
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" http://localhost:5000/api/students | jq
```

Review audits CSV:
```bash
ADMIN_TOKEN=<token>
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/quizzes/review-audits.csv -o review_audits.csv
```

Bulk review generation:
```bash
JOB_TOKEN=<job-token>
API_URL=http://localhost:5000/api ./scripts/run_generate_review_quizzes.sh 8 1
```

## 6. What to look for if something fails

- Admin login fails: make sure `JWT_SECRET_KEY` is set or run in development mode.
- Teacher cannot open `Students`: confirm the teacher account role is `teacher`.
- Notifications do not appear live: ensure the backend is running with `socketio.run(...)`.
- Job token fails: verify the token was created from `Job Tokens` and has not expired.
- Audit CSV is empty: create a review quiz first so audit rows exist.
