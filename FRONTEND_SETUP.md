# 🎨 Frontend Setup Guide

## What Changed

Your **IELTSApp.jsx** now connects to the real backend API instead of using mock data:

✅ Real login with JWT tokens  
✅ Real task retrieval from backend  
✅ Real score/streak from database  
✅ Audio upload to Cloudinary  
✅ Student/admin different views  

---

## 📋 Quick Start (3 Options)

### Option 1: React App (Recommended)

If you have a React project:

```bash
# 1. Copy the file
cp IELTSApp.jsx /path/to/your/react/src/App.jsx

# 2. Install (should already be there)
npm install

# 3. Update .env
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# 4. Start
npm start
```

### Option 2: Vite React

```bash
npm create vite@latest my-ielts-app -- --template react
cd my-ielts-app
npm install
cp /workspaces/IELTS/IELTSApp.jsx src/App.jsx
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev
```

### Option 3: Standalone (Quick Test)

Create `index.html` in `/workspaces/IELTS/`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IELTS App</title>
</head>
<body>
  <div id="root"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script type="text/babel" src="IELTSApp.jsx"></script>
  <script type="text/babel">
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
```

Then serve with:
```bash
python -m http.server 3000
```

---

## 🔌 API Configuration

### Environment Variables

**For React (CRA):**
```bash
# .env
REACT_APP_API_URL=http://localhost:5000/api
```

**For Vite:**
```bash
# .env
VITE_API_URL=http://localhost:5000/api
```

**Default (if not set):**
```
http://localhost:5000/api
```

### Change API URL in Code

Edit line 7 of `IELTSApp.jsx`:

```jsx
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
```

To use a different URL:

```jsx
// Development
const API_BASE_URL = "http://localhost:5000/api";

// Production
const API_BASE_URL = "https://your-app.com/api";

// Cloud deployment
const API_BASE_URL = "https://your-heroku-app.herokuapp.com/api";
```

---

## 🧪 Testing the Connection

### 1. Make Sure Backend is Running

```bash
# In a separate terminal
cd /workspaces/IELTS
python app.py
```

Expected output:
```
* Running on http://127.0.0.1:5000
```

### 2. Start Frontend

```bash
npm start
# or
npm run dev
```

### 3. Try Login

Go to http://localhost:3000 (React) or http://localhost:5173 (Vite)

Use credentials:
- **Email:** student@ielts.com
- **Password:** admin123

If you see the dashboard → **✅ It works!**

### 4. Verify API Calls

Open **Developer Tools** (F12) → **Network** tab

When you login, you should see:
- ✅ POST `/api/auth/login` → 200
- ✅ GET `/api/auth/me` → 200
- ✅ GET `/api/tasks/today` → 200

---

## 🚨 Common Issues

### "Failed to fetch"
**Problem:** Backend not running or wrong URL  
**Fix:** 
```bash
# Make sure backend is running
python app.py

# Check API_BASE_URL in IELTSApp.jsx matches http://localhost:5000/api
```

### "CORS error"
**Problem:** Frontend and backend on different domains  
**Fix:** Backend already has CORS enabled. Check:
```bash
# Backend (app.py) should have:
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### "Login failed: Invalid credentials"
**Problem:** User doesn't exist in database  
**Fix:**
```bash
# Make sure demo user exists
python seed_data.py

# Or login with a user you created
```

### "TypeError: Cannot read property 'name' of undefined"
**Problem:** User object not properly set  
**Fix:** Check browser console for detailed error, make sure backend returns proper user object

---

## 📱 API Integration Points

Your app already handles:

| Feature | API Endpoint | Status |
|---------|-------------|--------|
| Login | POST `/api/auth/login` | ✅ Working |
| Get Profile | GET `/api/auth/me` | ✅ Ready |
| Get Today's Tasks | GET `/api/tasks/today` | ✅ Ready |
| Submit Task | POST `/api/submissions` | ✅ Ready |
| Get Leaderboard | GET `/api/users` | ✅ Ready |
| Get Plans | GET `/api/plans` | ✅ Ready |

---

## 🎯 Next Steps After Setup

1. **Login** → Should see real tasks from backend
2. **Submit Tasks** → Send to backend API
3. **Audio Recording** → Uploads to Cloudinary
4. **See Leaderboard** → Real student data
5. **Admin View** → Teacher can review submissions

---

## 📊 Debugging API Calls

Add this to browser console to test:

```javascript
// Test health check
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log("✅ Backend OK:", d))
  .catch(e => console.log("❌ Backend failed:", e))

// Test login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'student@ielts.com', password: 'admin123' })
})
  .then(r => r.json())
  .then(d => console.log("✅ Login OK:", d))
  .catch(e => console.log("❌ Login failed:", e))
```

---

## 🌐 Deploy Frontend

### Vercel (Easiest)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Set environment variable:
```
REACT_APP_API_URL = https://your-backend.herokuapp.com/api
```

### Netlify

```bash
# Build
npm run build

# Deploy built folder to Netlify
```

### GitHub Pages

```bash
npm run build
# Push `build/` folder to gh-pages branch
```

---

## 💾 JWT Token Management

Token is automatically:
- ✅ Stored in `localStorage` after login
- ✅ Sent with every API request in `Authorization` header
- ✅ Expires after 30 days

To logout:
```javascript
localStorage.removeItem("jwt_token");
window.location.reload();
```

---

## 🔐 Security Notes

⚠️ **In Production:**
- Use HTTPS only
- Don't expose API URL in client code
- Implement refresh token flow
- Use secure cookies instead of localStorage
- Add CSRF protection

---

## 📚 Full API Reference

See **API_REFERENCE.md** for all 30 endpoints with examples

## 🆘 Need Help?

1. Check **VISUAL_GUIDE.md** for expected outputs
2. Check browser console (F12) for errors
3. Check backend logs (where you ran `python app.py`)
4. Test API with Swagger UI at `/apidocs/`

---

**Ready? Start the frontend now! 🚀**

```bash
npm start
```

Then login with:
- Email: `student@ielts.com`
- Password: `admin123`

Enjoy! 🎉
