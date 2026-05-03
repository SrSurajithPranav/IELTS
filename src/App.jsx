import React, { useState, useEffect, useContext, createContext, useRef } from "react";

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:         #0d0f14;
      --bg2:        #13161e;
      --bg3:        #1a1e2a;
      --border:     #252a38;
      --accent:     #4f8ef7;
      --accent2:    #7c3aed;
      --gold:       #f5c842;
      --success:    #22c55e;
      --danger:     #ef4444;
      --warn:       #f59e0b;
      --text:       #e8eaf0;
      --muted:      #6b7280;
      --card:       #161b27;
      --radius:     14px;
      --sidebar-w:  240px;
    }

    html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .playfair { font-family: 'Playfair Display', serif; }

    button { cursor: pointer; border: none; font-family: inherit; }
    input, textarea, select { font-family: inherit; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: .6; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .fade-up { animation: fadeUp .45s ease both; }
    .fade-up-2 { animation: fadeUp .45s .1s ease both; }
    .fade-up-3 { animation: fadeUp .45s .2s ease both; }
    .fade-up-4 { animation: fadeUp .45s .3s ease both; }
  `}</style>
);
// ─────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────
const AuthCtx = createContext(null);

// ─────────────────────────────────────────────
// API CONFIGURATION
// ─────────────────────────────────────────────
const ENV_API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "";

// If running under Vite dev server, prefer a relative `/api` path so the dev-server
// proxy (vite.config.js) forwards requests to the backend and avoids CORS.
const IS_VITE_DEV = typeof import.meta !== "undefined" && !!import.meta.env && !!import.meta.env.DEV;

const IS_GITHUB_FORWARDED_HOST =
  typeof window !== "undefined" && /\.app\.github\.dev$/.test(window.location.hostname);

const INFERRED_GITHUB_API_BASE_URL =
  IS_GITHUB_FORWARDED_HOST
    ? `${window.location.protocol}//${window.location.hostname.replace(/-\d+\.app\.github\.dev$/, "-5000.app.github.dev")}/api`
    : "";

const isLocalApiUrl = (value) =>
  typeof value === "string" &&
  (/^https?:\/\/localhost(?::\d+)?\/api\/?$/i.test(value) || /^https?:\/\/127\.0\.0\.1(?::\d+)?\/api\/?$/i.test(value));

let API_BASE_URL = "http://localhost:5000/api";
if (IS_VITE_DEV) {
  API_BASE_URL = ENV_API_BASE_URL && !isLocalApiUrl(ENV_API_BASE_URL) ? ENV_API_BASE_URL : "/api";
} else if (IS_GITHUB_FORWARDED_HOST) {
  API_BASE_URL = INFERRED_GITHUB_API_BASE_URL || (ENV_API_BASE_URL && !isLocalApiUrl(ENV_API_BASE_URL) ? ENV_API_BASE_URL : API_BASE_URL);
} else {
  API_BASE_URL = ENV_API_BASE_URL || API_BASE_URL;
}
const API_TIMEOUT = 10000;

const parseJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Fetch with timeout
const apiCall = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("jwt_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      const message = data && typeof data === "object" && data.error
        ? data.error
        : `API error: ${response.status}`;
      throw new Error(message);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};

// API Methods
const authAPI = {
  login: (email, password) => apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }),
  register: (name, email, password) => apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  }),
  getProfile: () => apiCall("/auth/me")
};

const tasksAPI = {
  getToday: () => apiCall("/tasks/today"),
  getDay: (day) => apiCall(`/tasks/day/${day}`),
  create: (data) => apiCall("/tasks", {
    method: "POST",
    body: JSON.stringify(data)
  })
};

const submissionsAPI = {
  submit: (taskId, content, audioBlob) => {
    const formData = new FormData();
    formData.append("task_id", taskId);
    formData.append("content", content);
    if (audioBlob) formData.append("audio", audioBlob, "recording.webm");
    
    const token = localStorage.getItem("jwt_token");
    return fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }).then(r => r.json());
  },
  getStudentSubs: (studentId) => apiCall(`/submissions/student/${studentId}`),
  getPending: () => apiCall("/submissions/pending")
};

const plansAPI = {
  getAll: () => apiCall("/plans"),
  create: (data) => apiCall("/plans", {
    method: "POST",
    body: JSON.stringify(data)
  })
};

const usersAPI = {
  getStudents: () => apiCall("/users"),
  update: (userId, data) => apiCall(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  })
};

const batchesAPI = {
  getAll: () => apiCall("/batches"),
  create: (data) => apiCall("/batches", {
    method: "POST",
    body: JSON.stringify(data)
  })
};

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const useAuth = () => useContext(AuthCtx);

const MOCK_USERS = [
  { id: 1, name: "Arjun Kumar",    email: "student@ielts.com", password: "123", role: "student", streak: 7,  zoom: "https://zoom.us/j/123456789", score: 68 },
  { id: 2, name: "Priya Sharma",   email: "priya@ielts.com",   password: "123", role: "student", streak: 12, zoom: "https://zoom.us/j/123456789", score: 72 },
  { id: 3, name: "Ms. Kavitha",    email: "teacher@ielts.com", password: "123", role: "admin",   streak: 0,  zoom: "" },
];

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const MOCK_TASKS = [
  { id: 1, day: 1, type: "listening", title: "Listening Practice – Section 1", desc: "Listen to a conversation between two people about booking accommodation.", duration: "30 min", status: "reviewed" },
  { id: 2, day: 1, type: "speaking",  title: "Speaking Task – Part 1 Introduction", desc: "Record yourself answering: Tell me about your hometown. What do you like about it?", duration: "15 min", status: "submitted" },
  { id: 3, day: 1, type: "writing",   title: "Writing Task 1 – Bar Chart", desc: "The chart shows electricity production in France between 1980–2012. Summarise in at least 150 words.", duration: "20 min", status: "pending" },
  { id: 4, day: 1, type: "reading",   title: "Reading Passage – Environment", desc: "Read the passage on climate change impacts and answer True/False/Not Given questions.", duration: "40 min", status: "pending" },
  { id: 5, day: 1, type: "grammar",   title: "Grammar Drill – Passive Voice", desc: "Complete the exercises on passive voice transformations.", duration: "20 min", status: "pending" },
];

const MOCK_SUBMISSIONS = [
  { id: 1, taskId: 2, taskTitle: "Speaking Task – Part 1",       type: "speaking", date: "2025-05-01", status: "reviewed",  feedback: "Great fluency! Work on pronunciation of 'th' sounds. Your pacing was excellent." },
  { id: 2, taskId: 3, taskTitle: "Writing Task 1 – Pie Chart",   type: "writing",  date: "2025-04-30", status: "submitted", feedback: "" },
  { id: 3, taskId: 1, taskTitle: "Listening – Section 2",        type: "listening",date: "2025-04-29", status: "reviewed",  feedback: "8/10 correct. Focus on number dictation." },
];

const MOCK_STUDENTS = [
  { id: 1, name: "Arjun Kumar",  email: "student@ielts.com", plan: "60-Day Intensive", progress: 62, streak: 7,  score: 68, weakAreas: ["Writing Task 1", "Listening Section 3"] },
  { id: 2, name: "Priya Sharma", email: "priya@ielts.com",   plan: "90-Day Complete",  progress: 38, streak: 12, score: 72, weakAreas: ["Speaking Part 3"] },
  { id: 3, name: "Ravi Menon",   email: "ravi@ielts.com",    plan: "60-Day Intensive", progress: 15, streak: 2,  score: 61, weakAreas: ["Grammar", "Vocabulary"] },
];

const MOCK_PLANS = [
  { id: 1, name: "60-Day Intensive", days: 60, students: 2, tasks_per_day: 5 },
  { id: 2, name: "90-Day Complete",  days: 90, students: 1, tasks_per_day: 4 },
];

// ─────────────────────────────────────────────
// SMART TASK GENERATOR
// ─────────────────────────────────────────────
const generateTasksForDay = (student, day) => {
  const level = student.score < 65 ? "beginner" : "intermediate";

  return [
    {
      id: `${day}-1`,
      day,
      type: "speaking",
      title: `Speaking Practice Day ${day}`,
      desc: "Answer the question using natural fluency.",
      duration: "15 min",
      status: "pending",
      difficulty: level
    },
    {
      id: `${day}-2`,
      day,
      type: "writing",
      title: `Writing Task ${day}`,
      desc: "Write at least 150 words.",
      duration: "20 min",
      status: "pending",
      difficulty: level
    },
    {
      id: `${day}-3`,
      day,
      type: "listening",
      title: `Listening Drill`,
      desc: "Complete listening section.",
      duration: "30 min",
      status: "pending",
      difficulty: level
    }
  ];
};

// ─────────────────────────────────────────────
// TINY COMPONENTS
// ─────────────────────────────────────────────
const Badge = ({ label, color = "accent" }) => {
  const colors = {
    accent:  { bg: "rgba(79,142,247,.15)",  text: "#4f8ef7" },
    success: { bg: "rgba(34,197,94,.15)",   text: "#22c55e" },
    warn:    { bg: "rgba(245,158,11,.15)",  text: "#f59e0b" },
    danger:  { bg: "rgba(239,68,68,.15)",   text: "#ef4444" },
    purple:  { bg: "rgba(124,58,237,.15)",  text: "#a78bfa" },
    gold:    { bg: "rgba(245,200,66,.15)",  text: "#f5c842" },
  };
  const c = colors[color] || colors.accent;
  return (
    <span style={{
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 99, letterSpacing: ".4px", textTransform: "uppercase"
    }}>{label}</span>
  );
};

const TaskTypeBadge = ({ type }) => {
  const map = { speaking: "accent", writing: "purple", listening: "success", reading: "warn", grammar: "gold" };
  return <Badge label={type} color={map[type] || "accent"} />;
};

const StatusBadge = ({ status }) => {
  const map = { pending: "warn", submitted: "accent", reviewed: "success" };
  return <Badge label={status} color={map[status] || "accent"} />;
};

const ProgressRing = ({ pct, size = 80, stroke = 6, color = "#4f8ef7" }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset .8s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" fill={color} fontSize={size/5} fontWeight={700}>{pct}%</text>
    </svg>
  );
};

const ProgressBar = ({ pct, color = "var(--accent)", height = 6 }) => (
  <div style={{ background: "var(--border)", borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width .8s ease" }} />
  </div>
);

const Spinner = () => (
  <div style={{ width: 22, height: 22, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
);

const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
    padding: 24, ...style
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) => {
  const variants = {
    primary:  { background: "var(--accent)",  color: "#fff" },
    purple:   { background: "var(--accent2)", color: "#fff" },
    outline:  { background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" },
    ghost:    { background: "transparent", color: "var(--muted)" },
    danger:   { background: "var(--danger)", color: "#fff" },
    success:  { background: "var(--success)", color: "#fff" },
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "13px 28px", fontSize: 15 } };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size], borderRadius: 9, fontWeight: 600,
      opacity: disabled ? .5 : 1, transition: "all .18s", ...style
    }}
      onMouseEnter={e => !disabled && (e.target.style.filter = "brightness(1.12)")}
      onMouseLeave={e => (e.target.style.filter = "")}
    >{children}</button>
  );
};

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const Sidebar = ({ page, setPage, user, onLogout }) => {
  const studentNav = [
    { id: "dashboard",    icon: "⊞",  label: "Dashboard" },
    { id: "tasks",        icon: "✓",  label: "Today's Tasks" },
    { id: "speaking",     icon: "🎧", label: "Speaking" },
    { id: "writing",      icon: "✍️", label: "Writing" },
    { id: "progress",     icon: "📊", label: "Progress" },
    { id: "mocktest",     icon: "⏱",  label: "Mock Test" },
    { id: "leaderboard",  icon: "🏆", label: "Leaderboard" },
    { id: "liveclass",    icon: "🎥", label: "Live Class" },
  ];
  const adminNav = [
    { id: "admin-home",     icon: "⊞",  label: "Overview" },
    { id: "admin-students", icon: "👥", label: "Students" },
    { id: "admin-plans",    icon: "📋", label: "Plans" },
    { id: "admin-tasks",    icon: "✓",  label: "Tasks" },
    { id: "admin-review",   icon: "🔍", label: "Review" },
  ];
  const nav = user?.role === "admin" ? adminNav : studentNav;

  return (
    <aside style={{
      width: "var(--sidebar-w)", background: "var(--bg2)", borderRight: "1px solid var(--border)",
      height: "100vh", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column",
      padding: "0 0 16px", zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div className="playfair" style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", letterSpacing: ".5px" }}>
          IELTS<span style={{ color: "var(--gold)" }}>Pro</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Smart Training Platform</div>
      </div>

      {/* User chip */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700
          }}>{user?.name?.[0]}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user?.name?.split(" ")[0]}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{user?.role === "admin" ? "Teacher" : "Student"}</div>
          </div>
        </div>
        {user?.role === "student" && user.streak > 0 && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(245,200,66,.1)", borderRadius: 8, padding: "6px 10px" }}>
            <span>🔥</span>
            <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>{user.streak} day streak</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflow: "auto" }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, background: page === item.id ? "rgba(79,142,247,.12)" : "transparent",
            color: page === item.id ? "var(--accent)" : "var(--muted)",
            fontSize: 13, fontWeight: page === item.id ? 600 : 400,
            border: page === item.id ? "1px solid rgba(79,142,247,.2)" : "1px solid transparent",
            marginBottom: 2, transition: "all .18s", textAlign: "left"
          }}
            onMouseEnter={e => { if (page !== item.id) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; } }}
            onMouseLeave={e => { if (page !== item.id) { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; } }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "0 10px" }}>
        <button onClick={onLogout} style={{
          width: "100%", padding: "10px 12px", borderRadius: 10, background: "transparent",
          color: "var(--muted)", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 10,
          border: "1px solid transparent", transition: "all .18s"
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(239,68,68,.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
        >⎋ Logout</button>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "13px 16px", color: "var(--text)", fontSize: 14, outline: "none", transition: "border .2s"
  };

  const handle = async () => {
    setErr(""); setLoading(true);
    try {
      const res = await authAPI.login(email, pass);
      if (!res || !res.token) throw new Error('Invalid response from server');
      localStorage.setItem("jwt_token", res.token);
      const usr = res.user;
      onLogin({ id: usr.id, name: usr.name, email: usr.email, role: usr.role, streak: usr.streak || 0, score: usr.score || 0 });
    } catch (e) {
      setErr(e.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 30% 20%, rgba(79,142,247,.08) 0%, transparent 60%), var(--bg)"
    }}>
      <GlobalStyles />
      <div className="fade-up" style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="playfair" style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)" }}>
            IELTS<span style={{ color: "var(--gold)" }}>Pro</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>Smart Training Platform</p>
        </div>

        <Card>
          <div className="playfair" style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Welcome back</div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Sign in to continue your IELTS journey</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6, fontWeight: 500 }}>Password</label>
              <input style={inp} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                onKeyDown={e => e.key === "Enter" && !loading && handle()} />
            </div>
            {err && <p style={{ color: "var(--danger)", fontSize: 12 }}>{err}</p>}
            <Btn onClick={handle} disabled={loading} size="lg" style={{ marginTop: 6, width: "100%" }}>
              {loading ? "Signing in…" : "Sign In"}
            </Btn>
          </div>

          <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--bg3)", borderRadius: 10, fontSize: 12, color: "var(--muted)" }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Demo Accounts</div>
            <div>Student: student@ielts.com / 123</div>
            <div>Teacher: teacher@ielts.com / 123</div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }}>Backend: {API_BASE_URL}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────
const TaskCard = ({ task, onSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(task.status !== "pending");
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const iconMap = { speaking: "🎧", writing: "✍️", listening: "📻", reading: "📖", grammar: "📝" };
  const colorMap = {
    speaking: "var(--accent)", writing: "#a78bfa", listening: "var(--success)",
    reading: "var(--warn)", grammar: "var(--gold)"
  };
  const color = colorMap[task.type] || "var(--accent)";

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      recorder.start();
      setRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } catch (err) {
      alert("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setRecording(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setExpanded(false);
    onSubmit && onSubmit(task.id);
  };

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <Card style={{ marginBottom: 14, borderLeft: `3px solid ${color}`, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
        onClick={() => !submitted && setExpanded(e => !e)}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0
        }}>{iconMap[task.type]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</span>
            <TaskTypeBadge type={task.type} />
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>⏱ {task.duration}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={submitted ? (task.status === "reviewed" ? "reviewed" : "submitted") : "pending"} />
          {!submitted && <span style={{ color: "var(--muted)", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>}
          {submitted && task.status === "reviewed" && <span style={{ fontSize: 16 }}>✅</span>}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "16px 0" }}>{task.desc}</p>

          {task.type === "writing" || task.type === "grammar" || task.type === "reading" ? (
            <div>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type your response here…" rows={5}
                style={{
                  width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
                  padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none"
                }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{text.split(/\s+/).filter(Boolean).length} words</span>
                <Btn onClick={handleSubmit} disabled={text.trim().length < 5}>Submit</Btn>
              </div>
            </div>
          ) : task.type === "speaking" ? (
            <div>
              <div style={{
                padding: 20, background: "var(--bg3)", borderRadius: 10, display: "flex",
                flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 14
              }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Recording</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Btn onClick={recording ? stopRecording : startRecording} variant={recording ? "danger" : "outline"}>
                    {recording ? `⏹ Stop (${fmtTime(recTime)})` : "⏺ Start Recording"}
                  </Btn>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{audioBlob ? "Recording saved" : "No recording yet"}</div>
                  <input type="file" accept="audio/*" style={{ fontSize: 12, color: "var(--muted)" }} onChange={e => { if (e.target.files && e.target.files[0]) setAudioBlob(e.target.files[0]); }} />
                </div>
              </div>
              <Btn onClick={handleSubmit} disabled={!audioBlob && text.trim().length === 0}>Submit Recording</Btn>
            </div>
          ) : (
            <div>
              <div style={{ padding: 16, background: "var(--bg3)", borderRadius: 10, marginBottom: 14, fontSize: 13, color: "var(--muted)" }}>
                📻 Open the audio lesson from your teacher's materials. Mark complete when done.
              </div>
              <Btn onClick={handleSubmit} variant="success">Mark as Complete</Btn>
            </div>
          )}
        </div>
      )}

      {task.status === "reviewed" && (
        <div style={{ padding: "12px 20px", background: "rgba(34,197,94,.06)", borderTop: "1px solid rgba(34,197,94,.15)" }}>
          <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, marginBottom: 4 }}>📋 Teacher Feedback</div>
          <div style={{ fontSize: 13, color: "var(--text)" }}>Great work! Focus on improving your vocabulary range and use more complex sentence structures.</div>
        </div>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────
const StudentDashboard = ({ user }) => {
  const completed = MOCK_TASKS.filter(t => t.status !== "pending").length;
  const total = MOCK_TASKS.length;
  const pct = Math.round((completed / total) * 100);

  const stats = [
    { label: "Day",      value: "Day 14",       icon: "📅", color: "var(--accent)" },
    { label: "Score",    value: user.score,      icon: "🎯", color: "var(--gold)" },
    { label: "Streak",   value: `${user.streak}🔥`, icon: "", color: "var(--warn)" },
    { label: "Reviewed", value: "3 tasks",       icon: "✅", color: "var(--success)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome */}
      <div className="fade-up">
        <div className="playfair" style={{ fontSize: 26, fontWeight: 700 }}>
          Good morning, {user.name.split(" ")[0]} 👋
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>You're on Day 14 of your 60-day plan. Keep going!</p>
      </div>

      {/* Stats row */}
      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Today's progress */}
      <Card className="fade-up-3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Today's Progress</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{completed} of {total} tasks done</div>
          </div>
          <ProgressRing pct={pct} />
        </div>
        <ProgressBar pct={pct} />
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {MOCK_TASKS.map(t => (
            <div key={t.id} style={{
              width: 32, height: 6, borderRadius: 99,
              background: t.status !== "pending" ? "var(--success)" : "var(--border)"
            }} />
          ))}
        </div>
      </Card>

      {/* Recent feedback */}
      <Card className="fade-up-4">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Recent Feedback 💬</div>
        {MOCK_SUBMISSIONS.filter(s => s.feedback).slice(0, 2).map(s => (
          <div key={s.id} style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.taskTitle}</span>
              <StatusBadge status={s.status} />
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{s.feedback}</p>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// TASKS PAGE (DYNAMIC)
// ─────────────────────────────────────────────
const TasksPage = ({ user }) => {
  const [day] = useState(14);
  const [tasks, setTasks] = useState(() => generateTasksForDay(user, day));

  const completed = tasks.filter(t => t.status !== "pending").length;
  const pct = Math.round((completed / tasks.length) * 100);

  const handleSubmit = (id) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: "submitted" } : t));
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <div className="playfair" style={{ fontSize: 22, fontWeight: 700 }}>Day {day} Tasks</div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Complete all tasks to maintain your streak</p>
      </div>

      <Card className="fade-up-2" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{completed}/{tasks.length} completed</span>
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} height={8} />
      </Card>

      <div className="fade-up-3">
        {tasks.map(task => <TaskCard key={task.id} task={task} onSubmit={handleSubmit} />)}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SPEAKING PAGE
// ─────────────────────────────────────────────
const SpeakingPage = () => {
  const subs = MOCK_SUBMISSIONS.filter(s => s.type === "speaking");
  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Speaking Submissions</div>
      {subs.map(s => (
        <Card key={s.id} className="fade-up-2" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.taskTitle}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.date}</div>
            </div>
            <StatusBadge status={s.status} />
          </div>
          {s.feedback && (
            <div style={{ marginTop: 14, padding: 14, background: "rgba(34,197,94,.06)", borderRadius: 10, fontSize: 13, color: "var(--muted)" }}>
              <span style={{ color: "var(--success)", fontWeight: 600, display: "block", marginBottom: 4 }}>Teacher Feedback</span>
              {s.feedback}
            </div>
          )}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Btn size="sm" variant="outline">▶ Play Recording</Btn>
          </div>
        </Card>
      ))}

      {/* New submission area */}
      <Card className="fade-up-3" style={{ border: "2px dashed var(--border)" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎧</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>New Speaking Submission</div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Record or upload your speaking response</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn>⏺ Record Audio</Btn>
            <Btn variant="outline">📁 Upload File</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// WRITING PAGE
// ─────────────────────────────────────────────
const analyzeWriting = (text) => {
  const words = text.split(/\s+/).length;

  return {
    grammarScore: Math.min(100, 60 + words / 5),
    vocabularyScore: 70,
    suggestions: [
      "Use more complex sentence structures",
      "Avoid repetition",
      "Add linking words (however, moreover)"
    ]
  };
};

const WritingPage = () => {
  const [text, setText] = useState("");
  const [grammarResult, setGrammarResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const subs = MOCK_SUBMISSIONS.filter(s => s.type === "writing");
  const words = text.split(/\s+/).filter(Boolean).length;

  const checkGrammar = () => {
    setChecking(true);
    setTimeout(() => {
      setGrammarResult(analyzeWriting(text));
      setChecking(false);
    }, 800);
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Writing Submissions</div>

      {/* New Writing */}
      <Card className="fade-up-2" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>New Writing Task</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          placeholder="Write your response here… (minimum 150 words for Task 1, 250 for Task 2)"
          style={{
            width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
            padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none"
          }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 13, color: words >= 150 ? "var(--success)" : "var(--muted)" }}>
            {words} words {words >= 150 ? "✓" : `(${150 - words} more needed)`}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" size="sm" onClick={checkGrammar} disabled={checking}>
              {checking ? "Checking…" : "🔍 AI Grammar Check"}
            </Btn>
            <Btn size="sm" disabled={words < 150}>Submit</Btn>
          </div>
        </div>

        {grammarResult && (
          <div style={{ marginTop: 16, padding: 16, background: "var(--bg3)", borderRadius: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span>AI Writing Analysis</span>
              <Badge label={`Score: ${grammarResult.grammarScore}/100`} color="success" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 8 }}>
                <strong>Suggestions:</strong>
              </div>
              {grammarResult.suggestions.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "var(--accent)", marginTop: 2 }}>→</span>
                  <span style={{ color: "var(--text)" }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
              <div>
                <span style={{ color: "var(--muted)" }}>Grammar:</span>
                <div style={{ color: "var(--accent)", fontWeight: 700 }}>{grammarResult.grammarScore}/100</div>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Vocabulary:</span>
                <div style={{ color: "var(--accent)", fontWeight: 700 }}>{grammarResult.vocabularyScore}/100</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Past submissions */}
      <div className="fade-up-3" style={{ fontWeight: 600, marginBottom: 12 }}>Past Submissions</div>
      {subs.map(s => (
        <Card key={s.id} className="fade-up-4" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>{s.taskTitle}</div>
            <StatusBadge status={s.status} />
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.date}</div>
        </Card>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// PROGRESS PAGE
// ─────────────────────────────────────────────
const ProgressPage = ({ user }) => {
  const skillData = [
    { label: "Listening", score: 7.0, color: "var(--success)" },
    { label: "Reading",   score: 6.5, color: "var(--warn)" },
    { label: "Writing",   score: 6.0, color: "#a78bfa" },
    { label: "Speaking",  score: 6.5, color: "var(--accent)" },
  ];
  const overall = (skillData.reduce((a, b) => a + b.score, 0) / skillData.length).toFixed(1);
  const weakAreas = skillData.filter(s => s.score < 6.5).map(s => s.label);

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Progress Tracker</div>

      {/* Overall band */}
      <Card className="fade-up-2" style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(79,142,247,.12),rgba(124,58,237,.08))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div className="playfair" style={{ fontSize: 56, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{overall}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Estimated Band</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Overall Progress</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Day 14 of 60 · 77% to go</div>
            <ProgressBar pct={23} height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
              <span>Day 1</span><span>Day 60</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <Card className="fade-up-3" style={{ marginBottom: 20, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)" }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "var(--danger)" }}>⚠ Areas to Improve</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {weakAreas.map(w => <Badge key={w} label={w} color="danger" />)}
          </div>
        </Card>
      )}

      {/* Skills */}
      <Card className="fade-up-4" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Skills Breakdown</div>
        {skillData.map((s, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>Band {s.score}</span>
            </div>
            <ProgressBar pct={(s.score / 9) * 100} color={s.color} height={8} />
          </div>
        ))}
      </Card>

      {/* Streak */}
      <Card className="fade-up-5" style={{ background: "rgba(245,200,66,.06)", border: "1px solid rgba(245,200,66,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 40 }}>🔥</div>
          <div>
            <div className="playfair" style={{ fontSize: 28, fontWeight: 700, color: "var(--gold)" }}>{user.streak} Days</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Current streak – keep it up!</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: 6,
              background: i < user.streak ? "var(--gold)" : "var(--border)",
              opacity: i < user.streak ? 1 : .4,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12
            }}>{i < user.streak ? "✓" : ""}</div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// MOCK TEST PAGE
// ─────────────────────────────────────────────
const MockTestPage = () => {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min
  const [testText, setTestText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setSubmitted(true);
          alert("Time's up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, []);

  const format = (s) => `${Math.floor(s/60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Mock Test Mode
      </div>

      <Card className="fade-up-2" style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(239,68,68,.12),rgba(245,158,11,.08))", border: "1px solid rgba(239,68,68,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Time Remaining</div>
            <div className="playfair" style={{ fontSize: 36, fontWeight: 700, color: timeLeft < 300 ? "var(--danger)" : "var(--warn)", fontVariantNumeric: "tabular-nums" }}>
              {format(timeLeft)}
            </div>
          </div>
          <ProgressRing pct={Math.round((timeLeft / 1800) * 100)} size={100} color={timeLeft < 300 ? "var(--danger)" : "var(--warn)"} />
        </div>
      </Card>

      <Card className="fade-up-3">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>
          Writing Task 1: Report Composition
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          The chart shows electricity production in France between 1980–2012. Summarize the information in at least 150 words.
        </p>
        <textarea
          value={testText}
          onChange={e => setTestText(e.target.value)}
          disabled={submitted}
          placeholder="Write your answer here…"
          rows={10}
          style={{
            width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
            padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {testText.split(/\s+/).filter(Boolean).length} words
          </span>
          <Btn onClick={() => setSubmitted(true)} disabled={submitted || testText.trim().length < 150}>
            {submitted ? "✓ Submitted" : "Submit Test"}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// LEADERBOARD PAGE
// ─────────────────────────────────────────────
const LeaderboardPage = () => {
  const leaderboardData = [
    { rank: 1, name: "Arjun Kumar", points: 120, streak: 7, score: 68 },
    { rank: 2, name: "Priya Sharma", points: 110, streak: 12, score: 72 },
    { rank: 3, name: "Ravi Menon", points: 95, streak: 2, score: 61 },
    { rank: 4, name: "Anjali Singh", points: 85, streak: 5, score: 65 },
    { rank: 5, name: "Rohan Das", points: 78, streak: 3, score: 59 },
  ];

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Leaderboard 🏆
      </div>

      <div className="fade-up-2">
        {leaderboardData.map((u, i) => {
          const isMedal = u.rank <= 3;
          const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
          return (
            <Card key={i} style={{
              marginBottom: 12, background: isMedal ? `rgba(${u.rank === 1 ? "245,200,66" : u.rank === 2 ? "192,192,192" : "205,127,50"},.08)` : "transparent",
              border: isMedal ? `2px solid ${u.rank === 1 ? "var(--gold)" : u.rank === 2 ? "#c0c0c0" : "#cd7f32"}` : "1px solid var(--border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 700, minWidth: 40 }}>
                  {isMedal ? medals[u.rank] : `#${u.rank}`}
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0
                }}>{u.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>🔥 {u.streak} day streak</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Score</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{u.score}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Points</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{u.points}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// LIVE CLASS PAGE
// ─────────────────────────────────────────────
const LiveClassPage = ({ user }) => (
  <div>
    <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Live Classes 🎥</div>

    <Card className="fade-up-2" style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(79,142,247,.1),rgba(124,58,237,.06))", border: "1px solid rgba(79,142,247,.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
        }}>🎥</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>IELTS Batch – May 2025</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Every Mon, Wed, Fri · 7:00 PM IST</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
            <span style={{ fontSize: 12, color: "var(--success)" }}>Next: Today 7 PM</span>
          </div>
        </div>
      </div>
      <a href={user.zoom || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <button style={{
          background: "#2D8CFF", color: "#fff", padding: "12px 28px", borderRadius: 10,
          fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", width: "100%"
        }}>
          📹 Join Live Class on Zoom
        </button>
      </a>
    </Card>

    <Card className="fade-up-3">
      <div style={{ fontWeight: 600, marginBottom: 14 }}>Upcoming Sessions</div>
      {[
        { date: "Mon, May 5", time: "7:00 PM", topic: "Writing Task 2 – Opinion Essays" },
        { date: "Wed, May 7", time: "7:00 PM", topic: "Speaking Part 2 – Cue Card Practice" },
        { date: "Fri, May 9", time: "7:00 PM", topic: "Listening – Multiple Choice" },
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.topic}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.date} · {s.time}</div>
          </div>
          <Btn size="sm" variant="outline">Remind Me</Btn>
        </div>
      ))}
    </Card>
  </div>
);

// ─────────────────────────────────────────────
// ADMIN – OVERVIEW
// ─────────────────────────────────────────────
const AdminHome = () => {
  const stats = [
    { label: "Total Students", value: 3,    icon: "👥", color: "var(--accent)" },
    { label: "Active Plans",   value: 2,    icon: "📋", color: "var(--success)" },
    { label: "Pending Review", value: 4,    icon: "🔍", color: "var(--warn)" },
    { label: "Avg Score",      value: "67", icon: "🎯", color: "var(--gold)" },
  ];
  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Teacher Dashboard</div>
      <p className="fade-up-2" style={{ color: "var(--muted)", marginBottom: 24 }}>Overview of all students and plans</p>

      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="fade-up-3">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Students at a Glance</div>
        {MOCK_STUDENTS.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0
            }}>{s.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.plan}</div>
            </div>
            <div style={{ width: 100 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{s.progress}%</div>
              <ProgressBar pct={s.progress} height={5} />
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{s.score}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>Est. score</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADMIN – STUDENTS
// ─────────────────────────────────────────────
const AdminStudents = () => {
  const [selected, setSelected] = useState(null);
  const [tag, setTag] = useState("");

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Students</div>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: selected ? "1fr 1fr" : "1fr" }}>
        <div>
          {MOCK_STUDENTS.map(s => (
            <Card key={s.id} style={{ marginBottom: 14, cursor: "pointer", border: selected?.id === s.id ? "1px solid var(--accent)" : "1px solid var(--border)" }}
              onClick={() => setSelected(s)}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
                }}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.email}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.plan}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 12 }}>🔥 {s.streak}</span>
                    <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>Score: {s.score}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgressBar pct={s.progress} />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{s.progress}% complete</div>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="playfair" style={{ fontSize: 18, fontWeight: 600 }}>{selected.name}</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", color: "var(--muted)", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { l: "Score", v: selected.score, c: "var(--gold)" },
                { l: "Streak", v: `${selected.streak}🔥`, c: "var(--warn)" },
                { l: "Progress", v: `${selected.progress}%`, c: "var(--accent)" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, minWidth: 80, textAlign: "center", background: "var(--bg3)", borderRadius: 10, padding: "12px 8px" }}>
                  <div style={{ fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Weak Areas</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {selected.weakAreas.map((w, i) => <Badge key={i} label={w} color="danger" />)}
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Add Weak Area Tag</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. Grammar" style={{
                flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none"
              }} />
              <Btn size="sm" onClick={() => tag && setTag("")}>Add</Btn>
            </div>

            <div style={{ marginTop: 16 }}>
              <Btn style={{ width: "100%" }} variant="purple">Assign New Plan</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADMIN – PLANS
// ─────────────────────────────────────────────
const AdminPlans = () => {
  const [showNew, setShowNew] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDays, setPlanDays] = useState(60);

  const inp = {
    width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none"
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="playfair fade-up" style={{ fontSize: 22, fontWeight: 700 }}>Plans</div>
        <Btn onClick={() => setShowNew(e => !e)}>+ New Plan</Btn>
      </div>

      {showNew && (
        <Card className="fade-up" style={{ marginBottom: 20, border: "1px solid var(--accent)" }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Create New Plan</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Plan Name</label>
              <input style={inp} value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. 60-Day Intensive" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Duration (days)</label>
              <input style={inp} type="number" value={planDays} onChange={e => setPlanDays(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn>Create Plan</Btn>
              <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        {MOCK_PLANS.map(p => (
          <Card key={p.id} className="fade-up-2">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="playfair" style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</div>
              <Badge label={`${p.days} days`} color="accent" />
            </div>
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>👥 {p.students} students</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>✓ {p.tasks_per_day} tasks/day</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm">Edit Tasks</Btn>
              <Btn size="sm" variant="outline">Assign</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADMIN – REVIEW (FEEDBACK)
// ─────────────────────────────────────────────
const AdminReview = () => {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const pending = MOCK_SUBMISSIONS.filter(s => s.status === "submitted");

  const saveFeedback = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSelected(null); setFeedback(""); }, 900);
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Review Submissions</div>
      <p className="fade-up-2" style={{ color: "var(--muted)", marginBottom: 20 }}>{pending.length} submissions awaiting feedback</p>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: selected ? "1fr 1fr" : "1fr" }}>
        <div>
          {MOCK_SUBMISSIONS.map(s => (
            <Card key={s.id} className="fade-up-3" style={{ marginBottom: 14, cursor: "pointer", border: selected?.id === s.id ? "1px solid var(--accent)" : "1px solid var(--border)" }}
              onClick={() => { setSelected(s); setFeedback(s.feedback || ""); }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{s.taskTitle}</div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                <span>📅 {s.date}</span>
                <TaskTypeBadge type={s.type} />
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div className="playfair" style={{ fontSize: 16, fontWeight: 600 }}>Give Feedback</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", color: "var(--muted)", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 12, background: "var(--bg3)", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{selected.taskTitle}</div>
              <div style={{ display: "flex", gap: 8 }}><TaskTypeBadge type={selected.type} /><StatusBadge status={selected.status} /></div>
            </div>
            {selected.type === "speaking" && (
              <div style={{ marginBottom: 14 }}>
                <Btn size="sm" variant="outline">▶ Play Student Recording</Btn>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Written Feedback</label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={5}
                placeholder="Write detailed feedback here…"
                style={{
                  width: "100%", background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: 12, color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none"
                }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Audio Feedback</label>
              <input type="file" accept="audio/*" style={{ fontSize: 13, color: "var(--muted)" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={saveFeedback} disabled={saving}>
                {saving ? "Saving…" : "Save Feedback"}
              </Btn>
              <Btn variant="outline" size="sm">Mark Reviewed</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADMIN – TASKS EDITOR
// ─────────────────────────────────────────────
const AdminTasks = () => {
  const [day, setDay] = useState(1);
  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Task Editor</div>
      <Card className="fade-up-2" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Select Day</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7].map(d => (
            <button key={d} onClick={() => setDay(d)} style={{
              width: 40, height: 40, borderRadius: 8, fontWeight: 600, fontSize: 13,
              background: day === d ? "var(--accent)" : "var(--bg3)",
              color: day === d ? "#fff" : "var(--muted)",
              border: "1px solid var(--border)", cursor: "pointer"
            }}>D{d}</button>
          ))}
          <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>…and so on</span>
        </div>
      </Card>

      <div className="fade-up-3">
        {MOCK_TASKS.map(t => (
          <Card key={t.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <TaskTypeBadge type={t.type} />
                  <Badge label={t.duration} color="gold" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="outline">Edit</Btn>
                <Btn size="sm" variant="danger">Remove</Btn>
              </div>
            </div>
          </Card>
        ))}
        <Btn style={{ marginTop: 8 }}>+ Add Task to Day {day}</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const handleLogin = (u) => {
    setUser(u);
    setPage(u.role === "admin" ? "admin-home" : "dashboard");
  };

  const handleLogout = () => { setUser(null); setPage("dashboard"); };

  if (!user) return <><GlobalStyles /><LoginPage onLogin={handleLogin} /></>;

  const studentPages = {
    dashboard: <StudentDashboard user={user} />,
    tasks:     <TasksPage user={user} />,
    speaking:  <SpeakingPage />,
    writing:   <WritingPage />,
    progress:  <ProgressPage user={user} />,
    mocktest:  <MockTestPage />,
    leaderboard: <LeaderboardPage />,
    liveclass: <LiveClassPage user={user} />,
  };
  const adminPages = {
    "admin-home":     <AdminHome />,
    "admin-students": <AdminStudents />,
    "admin-plans":    <AdminPlans />,
    "admin-tasks":    <AdminTasks />,
    "admin-review":   <AdminReview />,
  };
  const pages = user.role === "admin" ? adminPages : studentPages;
  const content = pages[page] || <div style={{ color: "var(--muted)" }}>Page not found</div>;

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
        <main style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "32px 32px 32px", minHeight: "100vh", overflowY: "auto" }}>
          <div style={{ maxWidth: 860 }}>
            {content}
          </div>
        </main>
      </div>
    </>
  );
}
