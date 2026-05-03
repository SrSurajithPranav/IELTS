# IELTS Backend Documentation

Complete Python Flask backend for the IELTS training platform with authentication, task management, submissions, feedback, and batch scheduling.

## Project Structure

```
IELTS/
├── IELTSApp.jsx              # React frontend component
├── app.py                     # Flask application factory
├── config.py                  # Configuration management
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── models/                    # SQLAlchemy models
│   ├── db.py                 # Database initialization
│   ├── user.py               # User model
│   ├── plan.py               # Training plan model
│   ├── task.py               # Daily task model
│   ├── student_plan.py       # Student-Plan association
│   ├── submission.py         # Task submission model
│   └── batch.py              # Batch & BatchMember models
├── routes/                    # API endpoints
│   ├── auth.py               # Authentication (register, login)
│   ├── tasks.py              # Task management
│   ├── submissions.py        # Submission handling & streak tracking
│   ├── feedback.py           # Teacher feedback
│   ├── plans.py              # Plan management
│   ├── users.py              # User management
│   └── batches.py            # Batch management
└── utils/                     # Helper utilities
    ├── storage.py            # Cloudinary audio upload
    └── ai_helpers.py         # AI helpers (mocked, ready for APIs)
```

## Setup Instructions

### 1. Prerequisites
- Python 3.8+
- pip
- Virtual environment (recommended)

### 2. Installation

```bash
# Clone the repository
cd /workspaces/IELTS

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

### 3. Environment Setup

Edit `.env` with your configuration:

```env
FLASK_ENV=development
DATABASE_URL=sqlite:///ielts.db
JWT_SECRET_KEY=your_secret_key_here

# For Cloudinary (free tier for audio)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Initialize Database

```bash
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
>>>     db.create_all()
```

### 5. Run the Server

```bash
python app.py
```

Server runs at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user profile

### Tasks
- `GET /api/tasks/today` - Get today's tasks (auto-calculates day from start_date)
- `GET /api/tasks/day/<day>` - Get tasks for specific day
- `POST /api/tasks` - Create task (admin only)
- `PUT /api/tasks/<id>` - Update task (admin only)
- `DELETE /api/tasks/<id>` - Delete task (admin only)

### Submissions
- `POST /api/submissions` - Submit task (supports text + audio file)
- `GET /api/submissions/student/<student_id>` - Get student's submissions
- `GET /api/submissions/pending` - Get pending submissions (admin only)

### Feedback
- `POST /api/feedback/<submission_id>` - Give written/audio feedback (admin only)

### Plans
- `GET /api/plans` - List all plans
- `POST /api/plans` - Create new plan (admin only)
- `POST /api/plans/assign` - Assign plan to student (admin only)

### Users
- `GET /api/users` - List students (admin only)
- `PATCH /api/users/<user_id>` - Update user profile

### Batches
- `GET /api/batches` - Get user's batches
- `POST /api/batches` - Create batch (admin only)
- `POST /api/batches/<batch_id>/members` - Add member to batch (admin only)

## Key Features

### 1. Smart Task Generation
- Tasks auto-assign based on student's current day in plan
- Day calculated from `StudentPlan.start_date`
- Example: If student started 14 days ago, they're on Day 14

### 2. Streak Tracking
- Automatically incremented on each submission
- `_update_streak()` checks last active date
- Resets if student misses a day

### 3. Audio Upload
- Free tier: Cloudinary (25GB storage, 25GB bandwidth/month)
- Supports: mp3, wav, webm, ogg, m4a
- Returns secure HTTPS URL for playback

### 4. AI Helpers (Mocked, Ready to Integrate)
- `speech_to_text()` - Ready for Whisper API
- `check_grammar()` - Ready for LanguageTool or GPT-4o

### 5. Role-Based Access
- **Students**: Can view own tasks, submit, view feedback
- **Admins**: Can create plans, review submissions, manage users

## Database Models

### User
```python
id, name, email, password, role, score, streak, 
weak_areas, zoom_link, created_at
```

### Plan
```python
id, name, duration_days, session_type, description, created_at
```

### Task
```python
id, plan_id, day_number, type, title, description, 
duration, difficulty
```

### Submission
```python
id, student_id, task_id, content, file_url, status,
feedback_text, feedback_audio_url, submitted_at, reviewed_at
```

### StudentPlan
```python
id, student_id, plan_id, start_date, is_active
```

### Batch & BatchMember
```python
Batch: id, name, zoom_link, schedule, plan_id, created_at
BatchMember: id, batch_id, student_id, joined_at
```

## Integration with Frontend

### React/Frontend Setup
```javascript
const API_BASE = 'http://localhost:5000/api';

// Example: Login
const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token, user } = await res.json();
  localStorage.setItem('token', token);
  return user;
};

// Example: Get today's tasks
const getTodayTasks = async (token) => {
  const res = await fetch(`${API_BASE}/tasks/today`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Example: Submit task with audio
const submitTask = async (taskId, audio, token) => {
  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('audio', audio);
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return res.json();
};
```

## Production Deployment

### Using Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Using Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

### Environment Variables (Production)
- Use PostgreSQL instead of SQLite
- Set `FLASK_ENV=production`
- Use strong `JWT_SECRET_KEY`
- Configure Cloudinary credentials
- Enable HTTPS

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError: No module named 'flask'**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database locked (SQLite)**
   - Delete `ielts.db` and restart
   - Production: Use PostgreSQL

3. **Cloudinary upload fails**
   - Check `.env` credentials
   - Verify free tier storage limit

4. **JWT decode error**
   - Ensure token is in `Authorization: Bearer <token>` header
   - Check `JWT_SECRET_KEY` matches

## Future Enhancements

- [ ] Integrate Whisper API for speech-to-text
- [ ] Add LanguageTool for grammar checking
- [ ] Implement leaderboard scoring
- [ ] Add WebSocket for real-time notifications
- [ ] Email notifications for submissions
- [ ] Admin dashboard analytics
- [ ] Mobile app support (iOS/Android)
