# 20 IELTS Features - Complete Developer Guide

## 📚 Table of Contents
1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Feature Details](#feature-details)
6. [Integration Guide](#integration-guide)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- Git

### Setup (5 minutes)

```bash
# 1. Navigate to project
cd /workspaces/IELTS

# 2. Create virtual environment (if needed)
python -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
npm install

# 4. Start backend
python app.py

# 5. Start frontend (new terminal)
npm run dev

# 6. Visit http://localhost:5173
```

### Verify Installation
```bash
# Run integration test
python test_integration.py

# Should see: ✅ All endpoints registered
```

---

## Architecture Overview

### Technology Stack

```
Frontend: React 18.2 + Vite + react-router-dom + recharts
Backend: Flask + Flask-JWT-Extended + SQLAlchemy
API: RESTful with JWT authentication
Database: SQLite/PostgreSQL (configurable)
Deployment: Docker + Fly.io (or any cloud)
```

### Project Structure

```
/workspaces/IELTS/
├── Backend
│   ├── app.py                 # Flask app factory
│   ├── routes/               # API endpoints (blueprints)
│   │   ├── ai.py             # Writing + Speaking AI
│   │   ├── listening.py       # Listening features
│   │   ├── reading.py         # Reading features
│   │   └── speaking.py        # Speaking features
│   ├── models/               # Database models
│   ├── utils/                # Helper functions
│   └── requirements.txt       # Python dependencies
│
├── Frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── writing/      # 5 writing components
│   │   │   ├── speaking/     # 3 speaking components
│   │   │   ├── listening/    # 1 listening component
│   │   │   ├── reading/      # 2 reading components
│   │   │   └── ui/           # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   └── styles/           # CSS
│   ├── package.json          # npm dependencies
│   └── vite.config.js        # Vite config
│
└── Documentation
    └── .github/              # All guides and docs
```

### Authentication Flow

```
1. User logs in → receives JWT token
2. Token stored in localStorage
3. All API requests include Authorization: Bearer <token>
4. Backend validates token with @jwt_required() decorator
5. Request proceeds if token is valid
```

---

## Backend Implementation

### New Endpoints Overview

```
WRITING (7 endpoints)
├── POST /api/ai/writing/structure      # Check essay structure
├── POST /api/ai/writing/cohesive       # Analyze linking words
├── POST /api/ai/writing/cliches        # Detect banned phrases
└── [4 existing endpoints]

SPEAKING (8 endpoints)
├── GET  /api/speaking/cue-card-modes   # Get timer modes
├── POST /api/ai/speaking/part3-depth   # Check answer depth
├── POST /api/ai/speaking/tense-consistency # Detect tense issues
└── [5 existing endpoints]

LISTENING (5 endpoints)
├── GET  /api/listening/dictation/generate
├── POST /api/listening/dictation/check
├── POST /api/listening/spelling-check
├── GET  /api/listening/ng-false-drill
└── GET  /api/listening/sections

READING (5 endpoints)
├── GET  /api/reading/drill/<type>
├── POST /api/reading/awl-highlight
├── POST /api/reading/keywords/extract
├── POST /api/reading/ng-false-check
└── POST /api/reading/time-target
```

### Adding New Endpoints

**Example: Writing Structure Checker**

```python
# routes/ai.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required
import re

@ai_bp.route('/writing/structure', methods=['POST'])
@jwt_required()
def check_essay_structure():
    """
    Analyze essay structure for intro/body/conclusion
    
    Request: {
        "text": "essay text here..."
    }
    
    Response: {
        "complete": true/false,
        "missing": ["intro", "body2"],
        "feedback": "Essay missing introduction and second body paragraph"
    }
    """
    data = request.get_json()
    text = data.get('text', '').lower()
    
    intro_keywords = ['first', 'introduce', 'present', 'overview']
    body_keywords = ['furthermore', 'however', 'addition']
    conclusion_keywords = ['conclude', 'finally', 'summary']
    
    has_intro = any(k in text for k in intro_keywords)
    has_body1 = text.find('first') < text.find('furthermore') if 'first' in text and 'furthermore' in text else True
    has_body2 = text.count('moreover') > 1 or text.count('however') > 0
    has_conclusion = any(k in text for k in conclusion_keywords)
    
    missing = []
    if not has_intro: missing.append('intro')
    if not has_body1: missing.append('body1')
    if not has_body2: missing.append('body2')
    if not has_conclusion: missing.append('conclusion')
    
    return jsonify({
        'complete': len(missing) == 0,
        'missing': missing,
        'feedback': f"Missing: {', '.join(missing)}" if missing else "Good structure!"
    })
```

### Blueprint Registration

All blueprints automatically registered in `app.py`:

```python
# app.py
from routes.ai import ai_bp
from routes.speaking import speaking_bp
from routes.listening import listening_bp
from routes.reading import reading_bp

app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(speaking_bp, url_prefix='/api/speaking')
app.register_blueprint(listening_bp, url_prefix='/api/listening')
app.register_blueprint(reading_bp, url_prefix='/api/reading')
```

---

## Frontend Implementation

### Component Structure

Each component follows this pattern:

```jsx
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function FeatureName() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ /* data */ })
      });
      
      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      setState(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3>Feature Name</h3>
      {/* UI here */}
      <Button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </Button>
    </Card>
  );
}
```

### Using the API Service

```javascript
// services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  get: (endpoint, token) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
  },
  
  post: (endpoint, data, token) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json());
  }
};

// Usage in components
const token = localStorage.getItem('token');
const result = await api.post('/writing/structure', { text: essay }, token);
```

### Component State Management

For complex components, use context:

```jsx
// Example: Timed writing test
export default function TimedWritingTest() {
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [time, setTime] = useState({ task1: 1200, task2: 2400 }); // in seconds
  const [phase, setPhase] = useState('task1'); // 'task1' or 'task2'

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => ({
        ...prev,
        [phase]: prev[phase] - 1
      }));
      
      // Auto-lock when time runs out
      if (time[phase] === 0) {
        nextPhase();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, time]);

  const nextPhase = () => {
    if (phase === 'task1') {
      setPhase('task2');
    } else {
      // Test complete
      saveResults();
    }
  };

  return (
    <div>
      <h2>Task {phase === 'task1' ? '1' : '2'}</h2>
      <div>Time: {formatTime(time[phase])}</div>
      <textarea value={phase === 'task1' ? task1 : task2} 
                onChange={(e) => phase === 'task1' 
                  ? setTask1(e.target.value) 
                  : setTask2(e.target.value)} />
    </div>
  );
}
```

---

## Feature Details

### Writing Features

#### 1. Sentence Starter Library
- **File**: `src/components/writing/SentenceStarterLibrary.jsx`
- **Type**: Client-side (no API)
- **Data**: 30 templates for 6 chart types
- **Use**: Click to insert sentence into essay text area

```jsx
const startersByType = {
  bar: [
    'The bar chart illustrates...',
    'According to the chart...',
    '...'
  ],
  // ... more types
};
```

#### 2. Essay Structure Checker
- **File**: `src/components/writing/EssayStructureChecker.jsx`
- **Endpoint**: `POST /api/ai/writing/structure`
- **Payload**: `{ text: "essay text" }`
- **Response**: `{ complete: bool, missing: array, feedback: string }`

#### 3. Cohesive Device Analyzer
- **File**: `src/components/writing/CohesiveDeviceAnalyzer.jsx`
- **Endpoint**: `POST /api/ai/writing/cohesive`
- **Detects**: 20+ linking words (furthermore, however, in addition, etc.)
- **Feedback**: Device count, density %, band estimate

#### 4. Cliché Detector
- **File**: `src/components/writing/ClicheDetector.jsx`
- **Endpoint**: `POST /api/ai/writing/cliches`
- **Detects**: 9 banned phrases with alternatives
- **Feedback**: Found clichés with suggested replacements

#### 5. Timed Writing Test
- **File**: `src/components/writing/TimedWritingTest.jsx`
- **Type**: Client-side timer
- **Duration**: Task 1 (20 min), Task 2 (40 min)
- **Features**: Auto-locks, word counters, saves drafts

### Speaking Features

#### 6. Cue Card Timer
- **File**: `src/components/speaking/SpeakingTimer.jsx`
- **Endpoint**: `GET /api/speaking/cue-card-modes`
- **Modes**: Strict (2:00), Generous (2:30), Analysis
- **Recording**: Web Audio API integration

#### 7. Part 3 Depth Checker
- **File**: `src/components/speaking/Part3DepthChecker.jsx`
- **Endpoint**: `POST /api/ai/speaking/part3-depth`
- **Checks**: reason, example, contrast in answer
- **Scoring**: 0-3 points, band estimate

#### 8. Filler Word Detector
- **File**: `src/components/speaking/FillerWordDetector.jsx`
- **Type**: Client-side Web Speech API
- **Detects**: um, uh, like, you know, basically, actually, so, well, i mean
- **Alert**: 880Hz beep on detection

### Listening Features

#### 9. Dictation Drill
- **File**: `src/components/listening/DictationDrill.jsx`
- **Endpoints**: 
  - `GET /api/listening/dictation/generate`
  - `POST /api/listening/dictation/check`
- **Types**: Phone, Date, Postcode, Credit card, Time, %
- **Scoring**: Case-insensitive matching

#### 10. Spelling Check
- **Endpoint**: `POST /api/listening/spelling-check`
- **Penalties**: Common IELTS misspellings
- **Format**: Exact match required

### Reading Features

#### 11. AWL Highlighter
- **File**: `src/components/reading/AWLHighlighter.jsx`
- **Endpoint**: `POST /api/reading/awl-highlight`
- **Words**: 20 Band 1 Academic Word List words
- **Features**: Click for definitions, coverage %

#### 12. NG vs False Drill
- **File**: `src/components/reading/NGFalseDrill.jsx`
- **Endpoint**: `POST /api/reading/ng-false-check`
- **Distinction**: Educational feedback on why answer is correct

#### 13. Keyword Locator
- **Endpoint**: `POST /api/reading/keywords/extract`
- **Output**: Keyword locations with context (50 chars)

#### 14. Time Tracker
- **Endpoint**: `POST /api/reading/time-target`
- **Input**: Word count
- **Output**: Recommended reading pace

---

## Integration Guide

### Step-by-Step Integration

#### 1. Update Your Page Component

```jsx
// src/pages/student/WritingPage.jsx

import React from 'react';
import SentenceStarterLibrary from '../../components/writing/SentenceStarterLibrary';
import EssayStructureChecker from '../../components/writing/EssayStructureChecker';
import CohesiveDeviceAnalyzer from '../../components/writing/CohesiveDeviceAnalyzer';
import ClicheDetector from '../../components/writing/ClicheDetector';
import TimedWritingTest from '../../components/writing/TimedWritingTest';

export default function WritingPage() {
  const [essay, setEssay] = React.useState('');

  return (
    <div className="writing-page">
      <h1>IELTS Writing Practice</h1>
      
      <div className="features">
        <SentenceStarterLibrary 
          onInsert={(sentence) => setEssay(prev => prev + sentence + ' ')}
        />
        
        <EssayStructureChecker text={essay} />
        <CohesiveDeviceAnalyzer text={essay} />
        <ClicheDetector text={essay} />
        
        <TimedWritingTest onSubmit={(result) => {
          console.log('Test result:', result);
          // Save to database
        }} />
      </div>
      
      <textarea 
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        placeholder="Write your essay here..."
      />
    </div>
  );
}
```

#### 2. Add Required CSS

```css
/* Global styles for new components */

.writing-tools, .speaking-tools, .listening-tools, .reading-tools {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.feature-card {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.feature-card h3 {
  margin-top: 0;
  color: #333;
}

.band-score {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0.5rem;
  border-radius: 4px;
}

.band-score.excellent {
  background: #4caf50;
  color: white;
}

.band-score.good {
  background: #2196f3;
  color: white;
}

.band-score.fair {
  background: #ff9800;
  color: white;
}

.band-score.poor {
  background: #f44336;
  color: white;
}

/* AWL highlighting */
.awl-word {
  background: #fff59d;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  position: relative;
}

.awl-word:hover {
  background: #fdd835;
}

.awl-tooltip {
  position: absolute;
  background: #333;
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 100;
}

/* Cohesive device highlighting */
.cohesive-device {
  background: #c8e6c9;
  padding: 2px 4px;
  border-radius: 2px;
}

/* Button styling */
.analyze-btn {
  padding: 0.5rem 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.analyze-btn:hover {
  background: #1976d2;
}

.analyze-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

#### 3. Test the Integration

```bash
# 1. Start backend
python app.py

# 2. Start frontend
npm run dev

# 3. Navigate to your page
# http://localhost:5173/writing

# 4. Test each feature
```

---

## API Reference

### Authentication

All endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

### Writing Endpoints

#### Structure Checker
```
POST /api/ai/writing/structure
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "My essay text here..."
}

Response:
{
  "complete": false,
  "missing": ["body2", "conclusion"],
  "feedback": "Essay needs second body paragraph and conclusion"
}
```

#### Cohesive Analyzer
```
POST /api/ai/writing/cohesive
Content-Type: application/json

{
  "text": "..."
}

Response:
{
  "device_count": 8,
  "density": "1.5%",
  "devices": [
    {"word": "Furthermore", "count": 2},
    {"word": "However", "count": 1}
  ],
  "band_estimate": "6"
}
```

#### Cliché Detector
```
POST /api/ai/writing/cliches
Content-Type: application/json

{
  "text": "..."
}

Response:
{
  "cliches_found": [
    {
      "phrase": "in this modern world",
      "count": 1,
      "alternatives": ["today", "in modern society"]
    }
  ],
  "total_cliches": 1
}
```

### Speaking Endpoints

#### Cue Card Modes
```
GET /api/speaking/cue-card-modes
Authorization: Bearer <token>

Response:
{
  "modes": [
    {
      "name": "Strict",
      "description": "Hard cutoff at 2:00",
      "duration": 120
    },
    {
      "name": "Generous",
      "description": "Allows 30 seconds extra",
      "duration": 150
    },
    {
      "name": "Analysis",
      "description": "Unlimited for practice",
      "duration": null
    }
  ]
}
```

#### Part 3 Depth Checker
```
POST /api/ai/speaking/part3-depth
Authorization: Bearer <token>

{
  "question": "Do you think technology is beneficial?",
  "answer": "I think technology is very beneficial because..."
}

Response:
{
  "has_reason": true,
  "has_example": false,
  "has_contrast": true,
  "score": 2,
  "band_estimate": "6",
  "feedback": "Good reason and contrast, but needs specific example"
}
```

### Listening Endpoints

#### Generate Dictation
```
GET /api/listening/dictation/generate
Authorization: Bearer <token>

Response:
{
  "type": "phone",
  "text": "07521 893456",
  "category": "phone_number"
}
```

#### Check Dictation
```
POST /api/listening/dictation/check
Authorization: Bearer <token>

{
  "type": "phone",
  "answer": "07521 893456"
}

Response:
{
  "correct": true,
  "answer": "07521 893456",
  "message": "Perfect!"
}
```

### Reading Endpoints

#### AWL Highlight
```
POST /api/reading/awl-highlight
Authorization: Bearer <token>

{
  "passage": "The analysis of..."
}

Response:
{
  "highlighted_text": "<span class='awl'>analysis</span> of...",
  "awl_words": [
    {
      "word": "analysis",
      "definition": "detailed examination"
    }
  ],
  "coverage": "15%"
}
```

#### NG vs False Check
```
POST /api/reading/ng-false-check
Authorization: Bearer <token>

{
  "statement": "The author agrees with the statement",
  "answer": "NG"
}

Response:
{
  "correct": true,
  "feedback": "Correct! No information in passage supports or contradicts this."
}
```

---

## Troubleshooting

### Common Issues

#### 1. API Returns 401 Unauthorized

**Problem**: "Authorization Required" error

**Solution**:
- Check token is in localStorage: `localStorage.getItem('token')`
- Verify token hasn't expired: tokens expire after 24 hours
- Re-login and get new token

```javascript
// Check token
const token = localStorage.getItem('token');
if (!token) {
  // Redirect to login
  window.location.href = '/login';
}
```

#### 2. Component Won't Load

**Problem**: Component renders but shows error

**Solution**:
- Check browser console for errors
- Verify API endpoint exists: `python test_integration.py`
- Check network tab in DevTools
- Verify backend is running: `python app.py`

```bash
# Verify backend running
curl http://localhost:5000/api/health

# Check frontend can reach backend
curl http://localhost:5000/api/listening/sections
```

#### 3. Web Speech API Not Working

**Problem**: Filler word detector doesn't detect speech

**Solution**:
- Only works in Chrome/Edge browsers
- Requires HTTPS in production (HTTP OK for localhost)
- Need microphone permission
- Check browser console for errors

```javascript
// Check support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  console.log('Web Speech API not supported');
}
```

#### 4. Slow API Response

**Problem**: Features are slow to respond

**Solution**:
- Check database is responding
- Look for slow queries in server logs
- Consider caching frequently used data
- Use pagination for large datasets

#### 5. CORS Errors

**Problem**: Frontend can't reach backend API

**Solution**:
```python
# Add to app.py
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### Debug Mode

Enable debug logging:

```python
# app.py
import logging
logging.basicConfig(level=logging.DEBUG)

# In routes
@ai_bp.route('/endpoint', methods=['POST'])
def endpoint():
    app.logger.debug(f"Request data: {request.get_json()}")
    # ... rest of code
```

### Performance Optimization

```javascript
// 1. Memoize expensive calculations
const memoize = (fn) => {
  const cache = {};
  return (args) => {
    if (args in cache) return cache[args];
    return cache[args] = fn(args);
  };
};

// 2. Debounce API calls
const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// 3. Use when analyzing user input
const debouncedAnalyze = debounce(analyzeText, 500);
```

---

## Deployment

### Build for Production

```bash
# Backend
pip install -r requirements.txt
python app.py

# Frontend
npm run build
# Outputs to dist/
```

### Environment Variables

Create `.env` file:

```
FLASK_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=your-secret-key
API_URL=https://api.example.com
REACT_APP_API_URL=https://api.example.com
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.9

WORKDIR /app

# Backend
COPY requirements.txt .
RUN pip install -r requirements.txt

# Frontend build
FROM node:16 as frontend
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

# Final image
FROM python:3.9
WORKDIR /app
COPY --from=frontend /app/dist ./dist
COPY . .
RUN pip install -r requirements.txt

CMD ["python", "app.py"]
```

---

## Support & Resources

- **Documentation**: `.github/INTEGRATION_GUIDE.md`
- **Quick Start**: `.github/QUICK_START.sh`
- **Examples**: `.github/FEATURES_IMPLEMENTATION.md`
- **Tests**: `test_integration.py`

---

**Version**: 1.0
**Last Updated**: May 2026
**Status**: Production Ready ✅
