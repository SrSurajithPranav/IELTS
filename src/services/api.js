// ═══════════════════════════════════════════════════════════
// src/services/api.js
// Centralized API layer — all endpoints, all helpers
// ═══════════════════════════════════════════════════════════

// ── URL Resolution ───────────────────────────────────────
const ENV_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();
const _host = typeof window !== 'undefined' ? window.location.hostname : '';
const IS_CODESPACES = /\.app\.github\.dev$/.test(_host);

function _resolveApiBase() {
  // Always use VITE_API_URL if explicitly set (works for localhost too)
  if (ENV_API_BASE_URL) {
    const base = ENV_API_BASE_URL.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (IS_CODESPACES) {
    const backendHost = _host.replace(/-\d+\.app\.github\.dev$/, '-5000.app.github.dev');
    return `${window.location.protocol}//${backendHost}/api`;
  }
  // Fallback: relative /api (only works if Vite proxy is active on same port)
  return '/api';
}

export const API_BASE_URL = _resolveApiBase();
const API_TIMEOUT = 12000;

// ── Core Fetch Utility ───────────────────────────────────
async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiCall(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('jwt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      const message =
        data && typeof data === 'object' && data.error
          ? data.error
          : `API error: ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Check backend availability.');
    }
    if (error instanceof TypeError) {
      throw new Error(
        'Cannot reach backend API. Check backend/server availability and API URL settings.'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Multipart helper for file uploads ───────────────────
async function multipartCall(url, formData) {
  const token = localStorage.getItem('jwt_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await parseJsonSafely(response);
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && data.error
        ? data.error
        : `API error: ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// ═══════════════════════════════════════════════════════════
// API MODULES
// ═══════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) =>
    apiCall('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getProfile: () => apiCall('/auth/me'),
};

// ── Tasks ─────────────────────────────────────────────────
export const tasksAPI = {
  getToday: () => apiCall('/tasks/today'),
  getDay: (day) => apiCall(`/tasks/day/${day}`),
  getPlanDay: (planId, day) => apiCall(`/tasks/plan/${planId}/day/${day}`),
  create: (data) => apiCall('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  update: (taskId, data) =>
    apiCall(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (taskId) => apiCall(`/tasks/${taskId}`, { method: 'DELETE' }),
};

// ── Submissions ───────────────────────────────────────────
export const submissionsAPI = {
  submit: (taskId, content, audioBlob) => {
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('content', content || '');
    if (audioBlob) formData.append('audio', audioBlob, 'recording.webm');
    return multipartCall('/submissions', formData);
  },
  getStudentSubs: (studentId) => apiCall(`/submissions/student/${studentId}`),
  getPending: () => apiCall('/submissions/pending'),
  getAll: () => apiCall('/submissions'),
};

// ── Feedback ──────────────────────────────────────────────
export const feedbackAPI = {
  create: (submissionId, text, audioFile) => {
    const formData = new FormData();
    formData.append('feedback_text', text || '');
    if (audioFile) formData.append('audio', audioFile, 'feedback.webm');
    return multipartCall(`/feedback/${submissionId}`, formData);
  },
};

// ── Plans ─────────────────────────────────────────────────
export const plansAPI = {
  getAll: () => apiCall('/plans'),
  getAssignments: () => apiCall('/plans/assignments'),
  getMy: () => apiCall('/plans/my'),
  select: (planId) =>
    apiCall('/plans/select', { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
  assign: (studentId, planId, options = {}) =>
    apiCall('/plans/assign', {
      method: 'POST',
      body: JSON.stringify({
        student_id: Number(studentId),
        plan_id: Number(planId),
        due_date: options.due_date || null,
        reminder_days: options.reminder_days != null ? Number(options.reminder_days) : 3,
      }),
    }),
  assignBulk: (planId, studentIds, options = {}) =>
    apiCall('/plans/assign/bulk', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: Number(planId),
        student_ids: studentIds.map(Number),
        due_date: options.due_date || null,
        reminder_days: options.reminder_days != null ? Number(options.reminder_days) : 3,
      }),
    }),
  generateTasks: (planId, data = {}) =>
    apiCall(`/plans/${planId}/generate-tasks`, { method: 'POST', body: JSON.stringify(data) }),
  runReminders: (data = {}) =>
    apiCall('/plans/reminders/run', { method: 'POST', body: JSON.stringify(data) }),
  create: (data) => apiCall('/plans', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Users ─────────────────────────────────────────────────
export const usersAPI = {
  getStudents: () => apiCall('/students/'),
  update: (userId, data) =>
    apiCall(`/students/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Students ──────────────────────────────────────────────
export const studentsAPI = {
  getAll: () => apiCall('/students/'),
  create: (data) => apiCall('/students/', { method: 'POST', body: JSON.stringify(data) }),
  update: (studentId, data) =>
    apiCall(`/students/${studentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (studentId) => apiCall(`/students/${studentId}`, { method: 'DELETE' }),
  resetPassword: (studentId, password) =>
    apiCall(`/students/${studentId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};

// ── Batches ───────────────────────────────────────────────
export const batchesAPI = {
  getAll: () => apiCall('/batches'),
  create: (data) => apiCall('/batches', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Sessions ──────────────────────────────────────────────
export const sessionsAPI = {
  getAll: () => apiCall('/sessions/'),
  getRecordings: () => apiCall('/sessions/recordings'),
  create: (data) => apiCall('/sessions/', { method: 'POST', body: JSON.stringify(data) }),
  addRecording: (sessionId, data) =>
    apiCall(`/sessions/${sessionId}/recording`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Quizzes ───────────────────────────────────────────────
export const quizzesAPI = {
  getAll: (category) =>
    apiCall(category && category !== 'all' ? `/quizzes/?category=${category}` : '/quizzes/'),
  getRecommended: (params = {}) => {
    const search = new URLSearchParams();
    if (params.limit) search.set('limit', String(params.limit));
    if (params.studentId) search.set('student_id', String(params.studentId));
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiCall(`/quizzes/recommended${suffix}`);
  },
  getOne: (id) => apiCall(`/quizzes/${id}`),
  attempt: (id, answers) =>
    apiCall(`/quizzes/${id}/attempt`, { method: 'POST', body: JSON.stringify({ answers }) }),
  create: (data) => apiCall('/quizzes/', { method: 'POST', body: JSON.stringify(data) }),
  generateRandom: (data) =>
    apiCall('/quizzes/generate-random', { method: 'POST', body: JSON.stringify(data) }),
  addQuestion: (quizId, data) =>
    apiCall(`/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/quizzes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/quizzes/${id}`, { method: 'DELETE' }),
};

// ── Resources ─────────────────────────────────────────────
export const resourcesAPI = {
  getAll: (category) =>
    apiCall(category && category !== 'all' ? `/resources/?category=${category}` : '/resources/'),
  create: (data) => apiCall('/resources/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/resources/${id}`, { method: 'DELETE' }),
  update: (id, data) => apiCall(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── AI ────────────────────────────────────────────────────
export const aiAPI = {
  analyzeWriting: (text) =>
    apiCall('/ai/writing/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  brainstormWriting: (topic, stance = 'balanced') =>
    apiCall('/ai/writing/brainstorm', { method: 'POST', body: JSON.stringify({ topic, stance }) }),
  rewriteBand9: (text) =>
    apiCall('/ai/writing/rewrite', { method: 'POST', body: JSON.stringify({ text }) }),
  analyzeSpeaking: (transcript, audio_url) =>
    apiCall('/ai/speaking/analyze', { method: 'POST', body: JSON.stringify({ transcript, audio_url }) }),
  speakingFollowups: (topic, level = 'intermediate') =>
    apiCall('/ai/speaking/followups', { method: 'POST', body: JSON.stringify({ topic, level }) }),
  analyzeDebate: (topic, argument) =>
    apiCall('/ai/debate/analyze', { method: 'POST', body: JSON.stringify({ topic, argument }) }),
  analyzeQuiz: (data) =>
    apiCall('/ai/quiz/analyze', { method: 'POST', body: JSON.stringify(data) }),
  getStudyPlan: () => apiCall('/ai/study-plan'),
  getNextDrill: (data = {}) => apiCall('/ai/drill/next', { method: 'POST', body: JSON.stringify(data) }),
  getRiskReport: (studentId) =>
    apiCall(studentId ? `/ai/progress/risk-report?student_id=${studentId}` : '/ai/progress/risk-report'),
};

// ── Leaderboard ───────────────────────────────────────────
export const leaderboardAPI = {
  get: (filter) =>
    apiCall(filter ? `/leaderboard/?filter=${filter}` : '/leaderboard/'),
};

// ── Notifications ─────────────────────────────────────────
export const notificationsAPI = {
  getAll: () => apiCall('/notifications/'),
  markRead: (id) => apiCall(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiCall('/notifications/read-all', { method: 'POST' }),
};

// ── Announcements ─────────────────────────────────────────
export const announcementsAPI = {
  getAll: () => apiCall('/announcements/'),
  create: (data) => apiCall('/announcements/', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Vocabulary ────────────────────────────────────────────
export const vocabularyAPI = {
  getWords: () => apiCall('/vocabulary/'),
  addWord: (data) => apiCall('/vocabulary/', { method: 'POST', body: JSON.stringify(data) }),
  practice: (wordId, correct) =>
    apiCall(`/vocabulary/${wordId}/review`, { method: 'POST', body: JSON.stringify({ correct }) }),
  getDue: () => apiCall('/vocabulary/review-due'),
};

// ── Mistakes ──────────────────────────────────────────────
export const mistakesAPI = {
  get: () => apiCall('/mistakes/'),
  log: (items) => apiCall('/mistakes/', { method: 'POST', body: JSON.stringify({ items }) }),
};

// ── Bookings ──────────────────────────────────────────────
export const bookingsAPI = {
  getSlots: () => apiCall('/bookings/slots'),
  book: (slotId) => apiCall('/bookings/', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
};

// ── Attendance ────────────────────────────────────────────
export const attendanceAPI = {
  get: () => apiCall('/attendance/'),
  checkIn: (sessionId) =>
    apiCall('/attendance/', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) }),
};

// ── Legacy helpers (backward compat) ─────────────────────
export { apiCall as default };

// ── Demo account filter ───────────────────────────────────
const DEMO_STUDENT_EMAILS = new Set([
  'student1@gmail.com',
  'student2@gmail.com',
  'student3@gmail.com',
  'student4@gmail.com',
  'student5@gmail.com',
  'student@ielts.com',
  'priya@ielts.com',
  'ravi@ielts.com',
]);
export const visibleStudents = (rows) =>
  Array.isArray(rows)
    ? rows.filter((s) => !DEMO_STUDENT_EMAILS.has(String(s?.email || '').toLowerCase()))
    : [];

// ── Mistake memory (localStorage) ────────────────────────
export const loadMistakeMemory = () => {
  try {
    const raw = localStorage.getItem('mistake_memory_v1');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};
export const pushMistakeMemory = (items) => {
  if (!Array.isArray(items) || items.length === 0) return;
  const current = loadMistakeMemory();
  const next = { ...current };
  items.forEach((item) => {
    const key = String(item || '').toLowerCase().trim();
    if (!key) return;
    next[key] = (next[key] || 0) + 1;
  });
  localStorage.setItem('mistake_memory_v1', JSON.stringify(next));
};
