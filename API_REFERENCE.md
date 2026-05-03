# IELTS Backend API Reference

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "score": 0,
    "streak": 0,
    "weak_areas": [],
    "zoom_link": null
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "user": {...}
}
```

### Get Profile
```http
GET /api/auth/me
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "score": 0,
  "streak": 0,
  "weak_areas": [],
  "zoom_link": null
}
```

---

## Tasks

### Get Today's Tasks
```http
GET /api/tasks/today
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
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
    }
  ],
  "day": 14
}
```

### Get Tasks for Specific Day
```http
GET /api/tasks/day/14
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "tasks": [...]
}
```

### Create Task (Admin Only)
```http
POST /api/tasks
Authorization: Bearer admin_token
Content-Type: application/json

{
  "plan_id": 1,
  "day_number": 1,
  "type": "listening",
  "title": "Listening Practice – Section 1",
  "description": "Listen to a conversation...",
  "duration": "30 min",
  "difficulty": "intermediate"
}
```

**Response (201):**
```json
{
  "id": 5,
  "plan_id": 1,
  "day_number": 1,
  "type": "listening",
  "title": "Listening Practice – Section 1",
  "description": "Listen to a conversation...",
  "duration": "30 min",
  "difficulty": "intermediate"
}
```

---

## Submissions

### Submit Task
```http
POST /api/submissions
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data

task_id: 1
content: "My written response..."
audio: [binary audio file]
```

**Response (201):**
```json
{
  "id": 1,
  "student_id": 1,
  "task_id": 1,
  "content": "My written response...",
  "file_url": "https://res.cloudinary.com/...",
  "status": "submitted",
  "feedback_text": null,
  "feedback_audio_url": null,
  "submitted_at": "2024-05-03T10:30:00",
  "reviewed_at": null
}
```

### Get Student's Submissions
```http
GET /api/submissions/student/1
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
[
  {
    "id": 1,
    "student_id": 1,
    "task_id": 1,
    "content": "...",
    "file_url": "...",
    "status": "submitted",
    "feedback_text": null,
    "feedback_audio_url": null,
    "submitted_at": "2024-05-03T10:30:00",
    "reviewed_at": null
  }
]
```

### Get Pending Submissions (Admin Only)
```http
GET /api/submissions/pending
Authorization: Bearer admin_token
```

**Response (200):**
```json
[
  {...},
  {...}
]
```

---

## Feedback

### Give Feedback (Admin Only)
```http
POST /api/feedback/1
Authorization: Bearer admin_token
Content-Type: multipart/form-data

feedback_text: "Great work! Consider improving..."
audio: [optional feedback audio file]
```

**Response (200):**
```json
{
  "id": 1,
  "student_id": 1,
  "task_id": 1,
  "content": "...",
  "file_url": "...",
  "status": "reviewed",
  "feedback_text": "Great work! Consider improving...",
  "feedback_audio_url": "https://res.cloudinary.com/...",
  "submitted_at": "2024-05-03T10:30:00",
  "reviewed_at": "2024-05-03T11:00:00"
}
```

---

## Plans

### List Plans
```http
GET /api/plans
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "60-Day Intensive",
    "duration_days": 60,
    "session_type": "solo",
    "description": "Complete IELTS preparation in 60 days"
  },
  {
    "id": 2,
    "name": "90-Day Complete",
    "duration_days": 90,
    "session_type": "batch_medium",
    "description": "Comprehensive 90-day IELTS course"
  }
]
```

### Create Plan (Admin Only)
```http
POST /api/plans
Authorization: Bearer admin_token
Content-Type: application/json

{
  "name": "60-Day Intensive",
  "duration_days": 60,
  "session_type": "solo",
  "description": "Complete IELTS preparation in 60 days"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "60-Day Intensive",
  "duration_days": 60,
  "session_type": "solo",
  "description": "Complete IELTS preparation in 60 days"
}
```

### Assign Plan to Student (Admin Only)
```http
POST /api/plans/assign
Authorization: Bearer admin_token
Content-Type: application/json

{
  "student_id": 1,
  "plan_id": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "student_id": 1,
  "plan_id": 1,
  "start_date": "2024-05-03",
  "is_active": true
}
```

---

## Users

### List Students (Admin Only)
```http
GET /api/users
Authorization: Bearer admin_token
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "score": 68,
    "streak": 7,
    "weak_areas": ["Writing", "Listening"],
    "zoom_link": "https://zoom.us/j/..."
  }
]
```

### Update User Profile
```http
PATCH /api/users/1
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "name": "John Doe Updated",
  "zoom_link": "https://zoom.us/j/new"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe Updated",
  "email": "john@example.com",
  "role": "student",
  "score": 68,
  "streak": 7,
  "weak_areas": [],
  "zoom_link": "https://zoom.us/j/new"
}
```

---

## Batches

### List Batches
```http
GET /api/batches
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "IELTS Batch – May 2024",
    "zoom_link": "https://zoom.us/j/123456789",
    "schedule": "Mon,Wed,Fri 7PM IST",
    "plan_id": 1
  }
]
```

### Create Batch (Admin Only)
```http
POST /api/batches
Authorization: Bearer admin_token
Content-Type: application/json

{
  "name": "IELTS Batch – May 2024",
  "zoom_link": "https://zoom.us/j/123456789",
  "schedule": "Mon,Wed,Fri 7PM IST",
  "plan_id": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "IELTS Batch – May 2024",
  "zoom_link": "https://zoom.us/j/123456789",
  "schedule": "Mon,Wed,Fri 7PM IST",
  "plan_id": 1
}
```

### Add Member to Batch (Admin Only)
```http
POST /api/batches/1/members
Authorization: Bearer admin_token
Content-Type: application/json

{
  "student_id": 1
}
```

**Response (201):**
```json
{
  "message": "Added"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

---

## Streak Tracking Logic

- ✅ Streak increments on each submission
- 🔄 Continues if active today
- 🚫 Resets to 1 if user was inactive yesterday
- 📅 Checked via `last_active_date`

---

## Notes

- All timestamps are in UTC (ISO 8601 format)
- Audio files are uploaded to Cloudinary (free tier)
- JWT tokens expire after 30 days
- Student can only view own submissions
- Admin can view all submissions and give feedback
