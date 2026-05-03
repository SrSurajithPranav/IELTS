# ⚡ QUICK SETUP COMMANDS (Copy & Paste)

## Phase 1: Quick Setup (All Commands)

```bash
# Step 1: Navigate to project
cd /workspaces/IELTS

# Step 2: Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR: venv\Scripts\activate  # Windows

# Step 3: Install dependencies
pip install -r requirements.txt

# Step 4: Create .env file (DON'T forget to edit this!)
cat > .env << 'EOF'
FLASK_ENV=development
FLASK_APP=app.py
DATABASE_URL=sqlite:///ielts.db
JWT_SECRET_KEY=your-super-secret-key-change-this-12345
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
EOF

# Step 5: IMPORTANT - Edit .env file with YOUR Cloudinary credentials
nano .env
# Replace:
# - CLOUDINARY_CLOUD_NAME with your cloud name from Cloudinary dashboard
# - CLOUDINARY_API_KEY with your API key
# - CLOUDINARY_API_SECRET with your API secret
# Save: Ctrl+O, Enter, Ctrl+X

# Step 6: Initialize database
python3 << 'PYTHON_EOF'
from app import create_app, db
app = create_app('development')
with app.app_context():
    db.create_all()
    print("✅ Database initialized!")
PYTHON_EOF

# Step 7: (Optional) Seed demo data
python seed_data.py

# Step 8: Verify setup
python test_setup.py

# Step 9: Start server
python app.py
```

**Expected output after Step 9:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

## Cloudinary Setup (Detailed)

### Website Steps:
```
1. Visit: https://cloudinary.com/users/register/free
2. Sign up with email/password
3. Verify email
4. Go to Dashboard
5. Click "Settings" (gear icon)
6. Click "API Keys" tab
7. Copy these three values:
   - Cloud Name
   - API Key
   - API Secret
```

### Apply to .env:
```bash
# Edit the .env file you created
nano .env

# Change these lines:
CLOUDINARY_CLOUD_NAME=xyz123abc  # From dashboard
CLOUDINARY_API_KEY=987654321     # From dashboard
CLOUDINARY_API_SECRET=secret123  # From dashboard

# Save and exit
```

---

## Testing Commands (In New Terminal)

```bash
# Make sure backend is running in another terminal:
# python app.py

# Open new terminal, then:

# Test 1: Health Check
curl http://localhost:5000/api/health

# Test 2: Login (Demo User)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ielts.com","password":"admin123"}'

# Copy the token from response, then:

# Test 3: Get Profile (replace TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"

# Test 4: Get Today's Tasks (replace TOKEN)
curl http://localhost:5000/api/tasks/today \
  -H "Authorization: Bearer TOKEN_HERE"

# Test 5: Register New User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Your Name",
    "email":"your@email.com",
    "password":"yourpassword"
  }'
```

---

## Quick Fixes

### Problem: venv not found
```bash
python3 -m venv venv
source venv/bin/activate
```

### Problem: ModuleNotFoundError
```bash
# Make sure venv is activated (should see (venv) in terminal)
pip install -r requirements.txt
```

### Problem: Cloudinary not working
```bash
# Check .env file has correct values
cat .env

# Test connection
python3 << 'EOF'
import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
print("✅ Cloudinary configured!")
EOF
```

### Problem: Port 5000 already in use
```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port in app.py:
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Problem: Database error
```bash
# Reset database
rm ielts.db

# Reinitialize
python3 << 'EOF'
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print("✅ Fresh database created!")
EOF
```

---

## What Each Folder Does

| Folder | Contains | Purpose |
|--------|----------|---------|
| `models/` | User, Plan, Task, etc. | Database tables |
| `routes/` | auth.py, tasks.py, etc. | API endpoints |
| `utils/` | storage.py, ai_helpers.py | Helper functions |
| `*.py` | app.py, config.py | Main app & config |

---

## Environment Variables Explained

```env
FLASK_ENV=development
# use 'production' when deploying

FLASK_APP=app.py
# tells Flask where the app is

DATABASE_URL=sqlite:///ielts.db
# local database (use PostgreSQL in production)

JWT_SECRET_KEY=your-super-secret-key-change-this-12345
# used to sign JWT tokens - change this to secure random string

CLOUDINARY_CLOUD_NAME=your_cloud_name_here
# from Cloudinary dashboard

CLOUDINARY_API_KEY=your_api_key_here
# from Cloudinary dashboard

CLOUDINARY_API_SECRET=your_api_secret_here
# from Cloudinary dashboard - KEEP PRIVATE!
```

---

## API Endpoints Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | ❌ | Check if server is running |
| `/api/auth/register` | POST | ❌ | Create account |
| `/api/auth/login` | POST | ❌ | Get JWT token |
| `/api/auth/me` | GET | ✅ | Get your profile |
| `/api/tasks/today` | GET | ✅ | Get today's tasks |
| `/api/tasks/day/14` | GET | ✅ | Get day 14 tasks |
| `/api/submissions` | POST | ✅ | Submit task/audio |
| `/api/submissions/student/1` | GET | ✅ | View your submissions |
| `/api/plans` | GET | ✅ | List plans |
| `/api/users` | GET | ✅ Admin | List students |
| `/api/batches` | GET | ✅ | List batches |

**✅ Auth** = Need JWT token in header: `Authorization: Bearer YOUR_TOKEN`

---

## Folder Structure After Setup

```
/workspaces/IELTS/
├── venv/                    # Virtual environment (created in Step 2)
├── .env                     # Your credentials (created in Step 4)
├── ielts.db                 # Database file (created in Step 6)
├── IELTSApp.jsx             # React frontend
├── app.py                   # Main Flask app
├── config.py                # Configuration
├── requirements.txt         # Python packages
├── models/                  # Database models
│   ├── user.py
│   ├── plan.py
│   ├── task.py
│   ├── submission.py
│   └── ...
├── routes/                  # API endpoints
│   ├── auth.py
│   ├── tasks.py
│   ├── submissions.py
│   └── ...
└── utils/                   # Helpers
    ├── storage.py           # Cloudinary upload
    └── ai_helpers.py        # AI function placeholders
```

---

## Common Commands During Development

```bash
# Check if server is running
curl http://localhost:5000/api/health

# View database contents
python3 << 'EOF'
from app import create_app, db
from models.user import User
app = create_app()
with app.app_context():
    print("Users:", [(u.id, u.name, u.email) for u in User.query.all()])
EOF

# Reset database
rm ielts.db
python3 << 'EOF'
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
EOF

# Deactivate virtual environment when done
deactivate
```

---

## Testing Checklist

Run these in order (keep server running):

```bash
# 1. Health check
curl http://localhost:5000/api/health
# Expected: {"status":"healthy"}

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ielts.com","password":"admin123"}'
# Expected: {token: "...", user: {...}}

# 3. Save token from response above, then test auth endpoint
TOKEN="paste_token_here"
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Expected: {id, name, email, role, ...}

# 4. Get tasks
curl http://localhost:5000/api/tasks/today \
  -H "Authorization: Bearer $TOKEN"
# Expected: {tasks: [...], day: 1}

# 5. Run test suite
python test_setup.py
# Expected: ✅ All tests passed
```

---

## Next: Deploy to Cloud

After everything works locally:

1. **Choose platform:**
   - Heroku (easiest)
   - AWS (most powerful)
   - DigitalOcean (cheapest)
   - Railway.app (simple)

2. **Follow DEPLOYMENT_GUIDE.md** for your platform

3. **Update frontend API URL** from localhost to production URL

---

## Support

📚 Full guides:
- STEP_BY_STEP_GUIDE.md (detailed with explanations)
- API_REFERENCE.md (all endpoints with examples)
- DEPLOYMENT_GUIDE.md (production setup)
- BACKEND_README.md (architecture overview)

🆘 Troubleshooting:
```bash
# Run verification
python test_setup.py

# Check logs
cat ielts.log

# View database
sqlite3 ielts.db ".tables"
```

---

## Time Estimates

| Phase | Duration |
|-------|----------|
| Setup venv + install | 2 mins |
| Cloudinary signup | 3 mins |
| Database init | 1 min |
| Testing | 5 mins |
| Frontend integration | 10 mins |
| Deployment | 15 mins |
| **TOTAL** | **~35 mins** |

✅ **Start now!** Follow the commands above and you'll be done in less than an hour.
