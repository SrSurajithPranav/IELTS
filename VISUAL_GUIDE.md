# 📸 VISUAL SETUP GUIDE - What You'll See

## Step 1: Navigate & Activate Virtual Environment

### Command:
```bash
cd /workspaces/IELTS
python3 -m venv venv
source venv/bin/activate
```

### What You'll See:
```
user@machine:~/IELTS$ cd /workspaces/IELTS
user@machine:/workspaces/IELTS$ python3 -m venv venv
user@machine:/workspaces/IELTS$ source venv/bin/activate
(venv) user@machine:/workspaces/IELTS$ _
```

**✅ SUCCESS**: Notice `(venv)` appears in terminal

---

## Step 2: Install Dependencies

### Command:
```bash
pip install -r requirements.txt
```

### What You'll See:
```
(venv) user@machine:/workspaces/IELTS$ pip install -r requirements.txt
Collecting Flask==2.3.3
  Downloading Flask-2.3.3-py3-none-any.whl (101 kB)
Collecting Flask-SQLAlchemy==3.0.5
  Downloading Flask-SQLAlchemy-3.0.5-py3-none-any.whl (20 kB)
Collecting Flask-JWT-Extended==4.5.2
  Downloading Flask-JWT-Extended-4.5.2-py3-none-any.whl (58 kB)
...
Successfully installed Flask-2.3.3 Flask-SQLAlchemy-3.0.5 ...
(venv) user@machine:/workspaces/IELTS$ _
```

**✅ SUCCESS**: "Successfully installed" message appears

---

## Step 3: Create .env File

### Command:
```bash
cat > .env << 'EOF'
FLASK_ENV=development
FLASK_APP=app.py
DATABASE_URL=sqlite:///ielts.db
JWT_SECRET_KEY=your-super-secret-key-change-this-12345
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdefghij
EOF
```

### What You'll See:
```
(venv) user@machine:/workspaces/IELTS$ cat > .env << 'EOF'
> FLASK_ENV=development
> FLASK_APP=app.py
> ...
> EOF
(venv) user@machine:/workspaces/IELTS$ _
```

### Then Edit:
```bash
nano .env
```

You'll see:
```
  GNU nano 6.4                    .env                                        

FLASK_ENV=development
FLASK_APP=app.py
DATABASE_URL=sqlite:///ielts.db
JWT_SECRET_KEY=your-super-secret-key-change-this-12345
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdefghij

^G Help      ^O Write Out  ^X Exit      ^R Read File  ^\ Replace   ^T Go To Line
```

**Replace the CLOUDINARY values**, then press:
- `Ctrl+O` (Write Out)
- `Enter` 
- `Ctrl+X` (Exit)

**✅ SUCCESS**: File created and values replaced

---

## Step 4: Initialize Database

### Command:
```bash
python3 << 'PYTHON_EOF'
from app import create_app, db
app = create_app('development')
with app.app_context():
    db.create_all()
    print("✅ Database initialized!")
PYTHON_EOF
```

### What You'll See:
```
(venv) user@machine:/workspaces/IELTS$ python3 << 'PYTHON_EOF'
> from app import create_app, db
> app = create_app('development')
> with app.app_context():
>     db.create_all()
>     print("✅ Database initialized!")
> PYTHON_EOF
✅ Database initialized!
(venv) user@machine:/workspaces/IELTS$ _
```

**✅ SUCCESS**: "✅ Database initialized!" appears

### Verify Database Created:
```bash
ls -la *.db
```

You'll see:
```
-rw-r--r--  1 user  group  28672 May  3 10:30 ielts.db
```

**✅ SUCCESS**: Database file created (size > 0)

---

## Step 5: Verify Setup

### Command:
```bash
python test_setup.py
```

### What You'll See:
```
(venv) user@machine:/workspaces/IELTS$ python test_setup.py
🧪 IELTS Backend Setup Test

Testing imports...
✅ Flask
✅ Flask-SQLAlchemy
✅ Flask-JWT-Extended
✅ Flask-CORS
✅ Cloudinary

Testing models...
✅ Database
✅ User
✅ Plan
✅ Task
✅ StudentPlan
✅ Submission
✅ Batch & BatchMember

Testing app creation...
✅ App created successfully

Testing database...
✅ Database tables created

Testing auth routes...
✅ /api/auth/register
✅ /api/auth/login
✅ /api/auth/me

========================================
📊 Test Summary:
  ✅ PASS: Imports
  ✅ PASS: Models
  ✅ PASS: App Creation
  ✅ PASS: Database
  ✅ PASS: Routes

Total: 5/5 tests passed

🎉 All tests passed! Backend is ready.
(venv) user@machine:/workspaces/IELTS$ _
```

**✅ SUCCESS**: "All tests passed! Backend is ready."

---

## Step 6: Start Backend Server

### Command:
```bash
python app.py
```

### What You'll See:
```
(venv) user@machine:/workspaces/IELTS$ python app.py
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
 * Restarting with reloader
 * Debugger is active!
 * Debugger PIN: 123-456-789
```

**✅ SUCCESS**: "Running on http://127.0.0.1:5000"

**KEEP THIS TERMINAL OPEN** while testing

---

## Step 7: Test in New Terminal

### Open New Terminal:
Click terminal tab or open new terminal window

### Navigate to Project:
```bash
cd /workspaces/IELTS
source venv/bin/activate
```

### Test Health Check:
```bash
curl http://localhost:5000/api/health
```

### What You'll See:
```
(venv) user@machine:/workspaces/IELTS$ curl http://localhost:5000/api/health
{"status":"healthy"}(venv) user@machine:/workspaces/IELTS$ _
```

**✅ SUCCESS**: `{"status":"healthy"}` appears

---

## Step 8: Test Login

### Command:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ielts.com","password":"admin123"}'
```

### What You'll See:
```
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwi...",
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

**✅ SUCCESS**: Token and user data returned

### Save the Token:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6..."
```

---

## Step 9: Test Authenticated Endpoint

### Command:
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### What You'll See:
```
{
  "id": 1,
  "name": "Admin Teacher",
  "email": "admin@ielts.com",
  "role": "admin",
  "score": 0,
  "streak": 0,
  "weak_areas": [],
  "zoom_link": null
}
```

**✅ SUCCESS**: User profile returned (JWT working!)

---

## Step 10: Get Today's Tasks

### Command:
```bash
curl http://localhost:5000/api/tasks/today \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### What You'll See:
```
{
  "tasks": [
    {
      "id": 1,
      "plan_id": 1,
      "day_number": 14,
      "type": "speaking",
      "title": "Speaking Practice Day 14",
      "description": "Answer the question using natural fluency.",
      "duration": "15 min",
      "difficulty": "intermediate"
    },
    {
      "id": 2,
      "plan_id": 1,
      "day_number": 14,
      "type": "writing",
      "title": "Writing Task 14",
      "description": "Write at least 150 words.",
      "duration": "20 min",
      "difficulty": "intermediate"
    },
    {
      "id": 3,
      "plan_id": 1,
      "day_number": 14,
      "type": "listening",
      "title": "Listening Drill",
      "description": "Complete listening section.",
      "duration": "30 min",
      "difficulty": "intermediate"
    }
  ],
  "day": 14
}
```

**✅ SUCCESS**: Tasks for today returned!

---

## Step 11: Server Terminal (What You See There)

While you're testing in another terminal, your server terminal shows requests:

```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit

127.0.0.1 - - [03/May/2024 10:30:10] "GET /api/health HTTP/1.1" 200 -
127.0.0.1 - - [03/May/2024 10:30:15] "POST /api/auth/login HTTP/1.1" 200 -
127.0.0.1 - - [03/May/2024 10:30:20] "GET /api/auth/me HTTP/1.1" 200 -
127.0.0.1 - - [03/May/2024 10:30:25] "GET /api/tasks/today HTTP/1.1" 200 -
```

**✅ SUCCESS**: Each request shows "200" (success code)

---

## Common Errors & Fixes

### Error 1: "ModuleNotFoundError: No module named 'flask'"
```
Traceback (most recent call last):
  File "app.py", line 1, in <module>
    from flask import Flask
ModuleNotFoundError: No module named 'flask'
```

**Fix:**
```bash
pip install -r requirements.txt
```

---

### Error 2: "Address already in use"
```
OSError: [Errno 48] Address already in use

This socket is already in use, pick another port. You might want to rerun this server with `flask run --port 5001`
```

**Fix - Kill the process:**
```bash
lsof -i :5000
# Shows: python 12345 user 4u IPv4 0x123 0t0 TCP localhost:5000 (LISTEN)
kill 12345

# Or use different port:
python app.py  # Edit app.py to use port 5001
```

---

### Error 3: "Unauthorized" / "Missing Authorization Header"
```json
{
  "error": "Missing Authorization Header"
}
```

**Fix - Add token to request:**
```bash
# WRONG:
curl http://localhost:5000/api/auth/me

# RIGHT:
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Error 4: "Cloudinary upload fails"
```
Cloudinary upload error: AuthenticationError
```

**Fix - Check .env:**
```bash
cat .env | grep CLOUDINARY

# Make sure values are from your Cloudinary dashboard
# Not placeholder text like "demo" or "123456789"
```

---

### Error 5: "JWT decode error"
```json
{
  "error": "Invalid token"
}
```

**Fix - Get fresh token:**
```bash
# Login again to get fresh token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ielts.com","password":"admin123"}'

# Copy the new token and use it
```

---

## Success Indicators Checklist

✅ **Each indicates success:**

- [ ] `(venv)` in terminal → Virtual env activated
- [ ] "Successfully installed" → Dependencies installed
- [ ] `✅ Database initialized!` → Database created
- [ ] `Total: 5/5 tests passed` → All tests pass
- [ ] `Running on http://127.0.0.1:5000` → Server started
- [ ] `{"status":"healthy"}` → Health check works
- [ ] `"token": "..."` and `"user": {...}` → Login works
- [ ] User profile returned → Auth middleware works
- [ ] Tasks list returned → Database queries work
- [ ] Browser shows no CORS errors → CORS configured
- [ ] Audio uploads to Cloudinary → Cloud storage works

---

## What's Happening Behind the Scenes

1. **Virtual Env**: Isolates Python packages for this project
2. **Dependencies**: Flask, SQLAlchemy, JWT, CORS, Cloudinary
3. **Database**: SQLite file stores users, tasks, submissions
4. **JWT**: Tokens authenticate API requests
5. **Cloudinary**: Stores audio files in cloud (free tier)
6. **Routes**: 30 API endpoints for frontend to call
7. **Models**: 7 database tables with relationships

---

## Next: Frontend Integration

Once backend works, update your React app:

```javascript
// In IELTSApp.jsx or apiService.js
const API_BASE = 'http://localhost:5000/api';

// Replace mock login with:
const { token, user } = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
}).then(r => r.json());

localStorage.setItem('token', token);
```

---

## You're Ready! 🎉

If all these steps show ✅ SUCCESS, you have:
- ✅ Fully functional backend
- ✅ Database working
- ✅ Cloud storage configured
- ✅ API endpoints ready
- ✅ Authentication working

**Next:** Connect frontend and deploy to production!
