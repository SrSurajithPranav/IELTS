# 📋 COMPLETE SETUP PROCEDURE - Step by Step

## Phase 1: Local Setup (5 mins)

### Step 1.1: Clone & Navigate
```bash
# Navigate to project
cd /workspaces/IELTS

# Verify structure
ls -la
# Should see: IELTSApp.jsx, app.py, models/, routes/, utils/, requirements.txt
```

### Step 1.2: Create Virtual Environment
```bash
# Create venv
python3 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Verify activation (should show (venv) in terminal)
```

### Step 1.3: Install Dependencies
```bash
# Install all Python packages
pip install -r requirements.txt

# Verify (should see installed packages)
pip list | grep -E "Flask|SQLAlchemy|JWT|Cloudinary"
```

**Output should show:**
```
Flask                    2.3.3
Flask-SQLAlchemy         3.0.5
Flask-JWT-Extended       4.5.2
Flask-CORS              4.0.0
cloudinary              1.33.0
```

---

## Phase 2: Cloudinary Setup (Free Audio Storage) - 10 mins

### Step 2.1: Go to Cloudinary Website
```
Visit: https://cloudinary.com/users/register/free
```

### Step 2.2: Sign Up (Free Tier)
- **Email**: Use your email
- **Password**: Create strong password
- **Account type**: Programmer
- **Primary interest**: Media library & storage
- Click "Create Account"

### Step 2.3: Get API Credentials
After signup, you'll see Dashboard:
```
Dashboard > Settings > API Keys
```

Look for:
- **Cloud Name**: xxxxxx (top of page)
- **API Key**: xxxxxxxxx
- **API Secret**: xxxxxxxxx (keep this secret!)

### Step 2.4: Create .env File
```bash
# Navigate to project root
cd /workspaces/IELTS

# Create .env file
cat > .env << 'EOF'
# Flask Configuration
FLASK_ENV=development
FLASK_APP=app.py

# Database
DATABASE_URL=sqlite:///ielts.db

# JWT Secret (change this to something random)
JWT_SECRET_KEY=your-super-secret-key-change-this-12345

# Cloudinary (Copy from dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
EOF
```

### Step 2.5: Replace with Your Cloudinary Credentials
```bash
# Open .env and replace placeholders
nano .env

# Look for these three lines and replace with YOUR values from Cloudinary:
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Save (Ctrl+O, Enter, Ctrl+X)
```

### Step 2.6: Verify .env (Don't commit this!)
```bash
# Check file created
cat .env

# Should show your credentials (masked for safety)
# IMPORTANT: Add to .gitignore
echo ".env" >> .gitignore
```

---

## Phase 3: Database Initialization - 5 mins

### Step 3.1: Create Local Database
```bash
# Ensure venv is activated
source venv/bin/activate

# Initialize database from Python shell
python3 << 'PYTHON_EOF'
from app import create_app, db

# Create app
app = create_app('development')

# Create all tables
with app.app_context():
    db.create_all()
    print("✅ Database initialized!")
    print("✅ Tables created:")
    print("   - users")
    print("   - plans")
    print("   - tasks")
    print("   - student_plans")
    print("   - submissions")
    print("   - batches")
    print("   - batch_members")

PYTHON_EOF
```

**Expected output:**
```
✅ Database initialized!
✅ Tables created:
   - users
   - plans
   - tasks
   - student_plans
   - submissions
   - batches
   - batch_members
```

### Step 3.2: Verify Database File
```bash
# Check database file created
ls -la *.db

# Should see: ielts.db (with size > 0)
```

---

## Phase 4: Seed Initial Data (Optional but Recommended) - 5 mins

### Step 4.1: Create Seed Script
```bash
# Create seed file
cat > seed_data.py << 'EOF'
from app import create_app, db
from models.user import User
from models.plan import Plan
from models.task import Task
from werkzeug.security import generate_password_hash

app = create_app('development')

with app.app_context():
    # Create demo users
    admin = User(
        name='Admin Teacher',
        email='admin@ielts.com',
        password=generate_password_hash('admin123'),
        role='admin'
    )
    
    student1 = User(
        name='Arjun Kumar',
        email='student1@ielts.com',
        password=generate_password_hash('student123'),
        role='student',
        score=68,
        streak=7
    )
    
    student2 = User(
        name='Priya Sharma',
        email='student2@ielts.com',
        password=generate_password_hash('student123'),
        role='student',
        score=72,
        streak=12
    )
    
    # Create demo plan
    plan = Plan(
        name='60-Day Intensive',
        duration_days=60,
        session_type='solo',
        description='Complete IELTS preparation in 60 days'
    )
    
    # Save all
    db.session.add_all([admin, student1, student2, plan])
    db.session.commit()
    
    # Create tasks for day 1
    for day in range(1, 61):
        for task_type, duration in [
            ('speaking', '15 min'),
            ('writing', '20 min'),
            ('listening', '30 min')
        ]:
            task = Task(
                plan_id=plan.id,
                day_number=day,
                type=task_type,
                title=f'{task_type.upper()} Day {day}',
                description=f'Complete {task_type} task for day {day}',
                duration=duration,
                difficulty='intermediate' if day < 30 else 'advanced'
            )
            db.session.add(task)
    
    db.session.commit()
    print('✅ Seeding complete! Demo data created.')
    print('  Admin: admin@ielts.com / admin123')
    print('  Student 1: student1@ielts.com / student123')
    print('  Student 2: student2@ielts.com / student123')

EOF

# Run seed script
python seed_data.py
```

---

## Phase 5: Test Backend Server - 5 mins

### Step 5.1: Start Flask Server
```bash
# Ensure venv activated
source venv/bin/activate

# Start server
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
 * WARNING: Do not use the development server in production
```

### Step 5.2: Test Health Endpoint (in new terminal)
```bash
# Open new terminal, navigate to project
cd /workspaces/IELTS

# Test health check
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{"status":"healthy"}
```

### Step 5.3: Test Login Endpoint
```bash
# Test login with demo user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ielts.com",
    "password": "admin123"
  }'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin Teacher",
    "email": "admin@ielts.com",
    "role": "admin",
    "score": 0,
    "streak": 0,
    "weak_areas": [],
    "zoom_link": null
  }
}
```

### Step 5.4: Test Authenticated Endpoint
```bash
# Copy the token from response above
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get user profile
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Phase 6: Run Verification Tests - 3 mins

### Step 6.1: Run Setup Test
```bash
# In terminal with venv activated
python test_setup.py
```

**Expected output:**
```
✅ Imports
✅ Models
✅ App Creation
✅ Database
✅ Routes

Total: 5/5 tests passed
🎉 All tests passed! Backend is ready.
```

---

## Phase 7: Frontend Integration - 10 mins

### Step 7.1: Update Frontend API URL
```bash
# Open IELTSApp.jsx
nano IELTSApp.jsx

# At the top of file, add:
const API_BASE_URL = 'http://localhost:5000/api';

# (Keep server running while testing)
```

### Step 7.2: Create API Service Functions in Frontend
Add this to your React component:

```javascript
// Add at top of IELTSApp.jsx or in separate apiService.js
const API_BASE = 'http://localhost:5000/api';

// Auth API calls
const authAPI = {
  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  },

  getMe: async (token) => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// Tasks API calls
const tasksAPI = {
  getToday: async (token) => {
    const res = await fetch(`${API_BASE}/tasks/today`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getDay: async (day, token) => {
    const res = await fetch(`${API_BASE}/tasks/day/${day}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// Submissions API calls
const submissionsAPI = {
  submit: async (taskId, content, audioBlob, token) => {
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('content', content);
    if (audioBlob) formData.append('audio', audioBlob, 'recording.webm');

    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return res.json();
  },

  getStudentSubmissions: async (studentId, token) => {
    const res = await fetch(`${API_BASE}/submissions/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
```

### Step 7.3: Update Login Function in Frontend
Replace the mock login in your component:

```javascript
// OLD (mock):
const handleLogin = (u) => {
  setUser(u);
};

// NEW (with real API):
const handleLogin = async (email, password) => {
  try {
    const result = await authAPI.login(email, password);
    if (result.token) {
      setUser(result.user);
      setPage(result.user.role === 'admin' ? 'admin-home' : 'dashboard');
    } else {
      alert('Login failed: ' + result.error);
    }
  } catch (err) {
    alert('Login error: ' + err.message);
  }
};
```

---

## Phase 8: Test Full Integration - 10 mins

### Step 8.1: Keep Backend Running
```bash
# Terminal 1: Backend running
python app.py
# Output: Running on http://127.0.0.1:5000
```

### Step 8.2: Test in Browser
```bash
# Open browser and test endpoints using Postman or curl

# 1. Test health
curl http://localhost:5000/api/health

# 2. Register new student
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "password": "test123"
  }'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Save the token from response

# 4. Get today's tasks (replace TOKEN with actual token)
curl http://localhost:5000/api/tasks/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 5. Submit task (if you have audio)
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "task_id=1" \
  -F "content=My response" \
  -F "audio=@recording.webm"
```

### Step 8.3: Test Audio Upload to Cloudinary
```bash
# Create a test audio file
echo "test audio" > test.wav

# Upload via submission
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "task_id=1" \
  -F "content=Testing audio upload" \
  -F "audio=@test.wav"

# Expected response should have:
# "file_url": "https://res.cloudinary.com/xxxx/..."
```

---

## Phase 9: Production Preparation - 5 mins

### Step 9.1: Create Production .env
```bash
# For production (if deploying)
cat > .env.production << 'EOF'
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@db_host/ielts_db
JWT_SECRET_KEY=super-strong-random-key-minimum-32-characters
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF
```

### Step 9.2: Generate Strong JWT Secret
```bash
# Generate random JWT secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Copy output and update .env
# JWT_SECRET_KEY=output_here
```

### Step 9.3: Update CORS for Frontend
In `app.py`, update CORS configuration:

```python
# Current (development):
CORS(app, resources={r"/api/*": {"origins": "*"}})

# For production:
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",      # Local dev
    "http://localhost:5173",      # Vite dev
    "https://your-frontend-domain.com"  # Production
]}})
```

---

## Phase 10: Troubleshooting Common Issues

### Issue 1: ModuleNotFoundError
```bash
# Solution:
pip install -r requirements.txt
# Verify:
python -c "import flask; print(flask.__version__)"
```

### Issue 2: Cloudinary Authentication Failed
```bash
# Check credentials
cat .env | grep CLOUDINARY

# Test upload manually:
python3 << 'EOF'
import cloudinary
import os
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
try:
    result = cloudinary.api.resources(max_results=1)
    print("✅ Cloudinary connected!")
except Exception as e:
    print(f"❌ Error: {e}")
EOF
```

### Issue 3: CORS Error in Browser
```javascript
// In console, if you see CORS error:
// Solution: Update .env to include frontend URL
// CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Issue 4: JWT Token Expired
```bash
# Update JWT expiry in config.py:
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)  # Change as needed
```

### Issue 5: Database Locked (SQLite)
```bash
# Solution:
rm ielts.db
python3 << 'EOF'
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
EOF
```

---

## Phase 11: Monitoring & Debugging

### Check Logs
```bash
# See server logs
# Terminal shows:
# [2024-05-03 10:30:00] ERROR in app: ...
```

### Enable Detailed Logging
```python
# In app.py:
import logging
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)
```

### Test Database
```bash
python3 << 'EOF'
from app import create_app, db
from models.user import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"  - {user.name} ({user.email}) - {user.role}")
EOF
```

---

## ✅ Final Verification Checklist

- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip list` shows Flask, SQLAlchemy, etc.)
- [ ] `.env` file created with Cloudinary credentials
- [ ] Database initialized (`ielts.db` exists)
- [ ] Seed data created (optional)
- [ ] Backend server running on `http://localhost:5000`
- [ ] Health check working (`curl http://localhost:5000/api/health`)
- [ ] Login endpoint working (returns token)
- [ ] Authenticated endpoint working (returns user data)
- [ ] Test setup passing (`python test_setup.py`)
- [ ] Frontend connected to backend
- [ ] Audio upload to Cloudinary working
- [ ] No CORS errors in browser console
- [ ] No 401/403 errors (JWT working)
- [ ] Streak tracking working (test submission)

---

## 🎉 You're Ready!

Once all checks pass:
1. ✅ Backend fully operational
2. ✅ Cloud storage connected
3. ✅ Database running
4. ✅ Frontend integrated
5. ✅ Ready for production deployment

**Next Steps:**
- Deploy backend (see DEPLOYMENT_GUIDE.md)
- Connect frontend to production backend
- Monitor logs for errors
- Schedule database backups
- Set up SSL/HTTPS
