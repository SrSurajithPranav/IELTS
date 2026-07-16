
import { LiveSessionsPage, QuizzesPage, ResourcesPage, AdminSessionsMgr, AdminResourcesMgr, AdminQuizBuilder } from "./NewPages.jsx";
import AdminStudentsPage from "./pages/admin/Students.jsx";
import AdminJobTokens from "./pages/admin/JobTokens.jsx";
import ReviewAudits from './pages/admin/ReviewAudits.jsx';
import React, { useState, useEffect, useContext, createContext, useRef } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import {
  API_BASE_URL,
  apiCall,
  authAPI,
  aiAPI,
  tasksAPI,
  submissionsAPI,
  feedbackAPI,
  plansAPI,
  usersAPI,
  batchesAPI,
  studentsAPI,
  visibleStudents,
  loadMistakeMemory,
  pushMistakeMemory,
} from "./services/api";
import ThemeToggle from "./components/ThemeToggle";
import DotMenu from "./components/ui/DotMenu";
import AnnouncementBanner from "./components/AnnouncementBanner";
const NotificationCenter = React.lazy(() => import('./components/NotificationCenter'));
import VocabularyPage from "./pages/VocabularyPage";
import StudentGamesPage from "./pages/student/Games";

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:         #f4efe6;
      --bg2:        #fdf8ef;
      --bg3:        #fffaf2;
      --border:     #dbcbb8;
      --accent:     #146c72;
      --accent2:    #0f4c5c;
      --gold:       #d69429;
      --success:    #2f855a;
      --danger:     #c53030;
      --warn:       #b7791f;
      --text:       #1f2a33;
      --muted:      #667380;
      --card:       #fffcf7;
      --radius:     16px;
      --sidebar-w:  240px;
    }

    html, body, #root { height: 100%; font-family: 'Manrope', sans-serif; background: var(--bg); color: var(--text); }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .playfair { font-family: 'Fraunces', serif; }

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

// ─── Dev-only debug banner ────────────────────────────────────────────
const DebugBanner = () => {
  const [status, setStatus] = React.useState("checking");
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(r => r.ok ? setStatus("ok") : setStatus("error"))
      .catch(() => setStatus("error"));
  }, []);
  if (!import.meta.env.DEV) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: status === "ok" ? "rgba(52,211,153,.9)" : "rgba(239,68,68,.9)",
      color: "#000", fontSize: 11, fontWeight: 600, padding: "3px 12px",
      display: "flex", gap: 12, alignItems: "center"
    }}>
      <span>{status === "ok" ? "✓ Backend connected" : "✗ Backend unreachable"}</span>
      <span style={{opacity:.7}}>API: {API_BASE_URL}</span>
      {status === "error" && <span>→ Make sure Flask is running on port 5000, and port is set to Public in Codespaces</span>}
    </div>
  );
};

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const useAuth = () => useContext(AuthCtx);

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

const BandHistoryChart = ({ studentId }) => {
  const [points, setPoints] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const subs = await submissionsAPI.getStudentSubs(studentId);
        const bands = (subs || []).map(s => ({ date: s.created_at || s.date, band: s.band_estimate || s.band_estimate || null })).filter(x => x.band != null);
        // take last 12
        const last = bands.slice(-12);
        setPoints(last);
      } catch (e) { setPoints([]); }
    })();
  }, [studentId]);

  if (!points || points.length === 0) return <div style={{ fontSize: 13, color: "var(--muted)" }}>No band history yet</div>;
  const maxBand = Math.max(...points.map(p => Number(p.band)));
  const minBand = Math.min(...points.map(p => Number(p.band)));
  const w = 420, h = 120, pad = 12;
  const dx = (w - pad * 2) / Math.max(1, points.length - 1);
  const mapY = (v) => {
    if (maxBand === minBand) return h/2;
    return pad + (1 - (v - minBand) / (maxBand - minBand)) * (h - pad * 2);
  };
  const path = points.map((p, i) => `${i===0?'M':'L'} ${pad + i*dx} ${mapY(p.band)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ background: 'transparent' }}>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p,i) => (
        <circle key={i} cx={pad + i*dx} cy={mapY(p.band)} r={4} fill="var(--card)" stroke="var(--accent)" />
      ))}
    </svg>
  );
};

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
    { id: "vocabulary",   icon: "📓", label: "Vocabulary" },
    { id: "plans",        icon: "💼", label: "Plans" },
    { id: "tasks",        icon: "✓",  label: "Today's Tasks" },
    { id: "speaking",     icon: "🎧", label: "Speaking" },
    { id: "writing",      icon: "✍️", label: "Writing" },
    { id: "debate",       icon: "🗣️", label: "Debate Mode" },
    { id: "progress",     icon: "📊", label: "Progress" },
    { id: "ai-coach",     icon: "🤖", label: "AI Coach" },
    { id: "mocktest",     icon: "⏱",  label: "Mock Test" },
    { id: "games",        icon: "🧩", label: "Games" },
    { id: "leaderboard",  icon: "🏆", label: "Leaderboard" },
    { id: "liveclass",    icon: "🎥", label: "Live Class" },
    { id: "quizzes",      icon: "🧩", label: "Quizzes" },
    { id: "resources",    icon: "📚", label: "Resources" },
  ];
  const adminNav = [
    { id: "admin-home",     icon: "⊞",  label: "Overview" },
    { id: "admin-students", icon: "👥", label: "Students" },
    { id: "admin-plans",    icon: "📋", label: "Plans" },
    { id: "admin-tasks",    icon: "✓",  label: "Tasks" },
    { id: "admin-review",    icon: "🔍", label: "Review" },
    { id: "admin-sessions",    icon: "🎙", label: "Sessions" },
    { id: "admin-resources",   icon: "📚", label: "Resources" },
    { id: "admin-quizzes",     icon: "🧩", label: "Quiz Builder" },
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
      onLogin({
        id: usr.id, name: usr.name, email: usr.email, role: usr.role,
        streak: usr.streak || 0, score: usr.score || 0,
        created_at: usr.created_at || null,
        listening_band: usr.listening_band || null,
        reading_band: usr.reading_band || null,
        writing_band: usr.writing_band || null,
        speaking_band: usr.speaking_band || null,
        weak_areas: usr.weak_areas || '',
      });
    } catch (e) {
      setErr(e.message || "Login failed. If you are a student, wait for admin approval email confirmation.");
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

          <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--bg3)", borderRadius: 10, fontSize: 12, color: "var(--muted)", border: "1px dashed var(--border)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Student Sign-In</div>
            <div>Use a real student account created by the teacher. Approval may be required depending on deployment settings.</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>API: {API_BASE_URL}</div>
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
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = async () => {
    try {
      await submissionsAPI.submit(task.id, text, audioBlob);
      setSubmitted(true);
      setExpanded(false);
      onSubmit && onSubmit(task.id);
    } catch (err) {
      alert(err.message || "Submission failed");
    }
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
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "16px 0" }}>{task.description || task.desc}</p>

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
  const [todayTasks, setTodayTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    Promise.all([tasksAPI.getToday(), submissionsAPI.getStudentSubs(user.id)])
      .then(([tasksRes, submissionsRes]) => {
        setTodayTasks(tasksRes?.tasks || []);
        setSubmissions(submissionsRes || []);
      })
      .catch(() => {
        setTodayTasks([]);
        setSubmissions([]);
      });
  }, [user.id]);

  const todayTaskIds = new Set(todayTasks.map((task) => task.id));
  const todaySubmissions = submissions.filter((submission) => todayTaskIds.has(submission.task_id));
  const completed = todaySubmissions.filter((s) => s.status === "reviewed" || s.status === "submitted").length;
  const total = todayTasks.length || 1;
  const pct = Math.round((completed / total) * 100);

  const stats = [
    { label: "Day",      value: `Day ${todayTasks[0]?.day_number || 0}`, icon: "📅", color: "var(--accent)" },
    { label: "Score",    value: user.score,      icon: "🎯", color: "var(--gold)" },
    { label: "Streak",   value: `${user.streak}🔥`, icon: "", color: "var(--warn)" },
    { label: "Reviewed", value: `${todaySubmissions.filter((s) => s.status === "reviewed").length} tasks`, icon: "✅", color: "var(--success)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome */}
      <div className="fade-up">
        <div className="playfair" style={{ fontSize: 26, fontWeight: 700 }}>
          Good morning, {user.name.split(" ")[0]} 👋
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>Today's tasks and feedback are loaded from your active plan.</p>
      </div>

      <AnnouncementBanner />

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
          {todayTasks.map((t) => (
            <div key={t.id} style={{
              width: 32, height: 6, borderRadius: 99,
              background: "var(--success)"
            }} />
          ))}
        </div>
      </Card>

      {completed === total && total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge label="Perfect Day" color="gold" />
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>You completed all tasks today — great job!</div>
        </div>
      )}

      {/* Recent feedback */}
      <Card className="fade-up-4">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Recent Feedback 💬</div>
        {submissions.filter((s) => s.feedback_text).slice(0, 2).map((s) => (
          <div key={s.id} style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Task #{s.task_id}</span>
              <StatusBadge status={s.status} />
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{s.feedback_text}</p>
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
  const [day, setDay] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    Promise.all([tasksAPI.getToday(), submissionsAPI.getStudentSubs(user.id)])
      .then(([taskRes, submissionRes]) => {
        setDay(taskRes?.day || 0);
        setTasks(taskRes?.tasks || []);
        setSubmissions(submissionRes || []);
      })
      .catch(() => {
        setDay(0);
        setTasks([]);
        setSubmissions([]);
      });
  }, [user.id]);

  const completedTaskIds = new Set(submissions.map((submission) => submission.task_id));
  const completed = tasks.filter((task) => completedTaskIds.has(task.id)).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const handleSubmit = (id) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: "submitted" } : t));
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <div className="playfair" style={{ fontSize: 22, fontWeight: 700 }}>Day {day || "Today"} Tasks</div>
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
const SpeakingFollowupPanel = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    const t = topic.trim();
    if (!t) return;
    // Basic sanity check: topic should be at least 2 words or 8 chars to be a real IELTS topic
    const words = t.split(/\s+/).filter(Boolean);
    const CONVERSATIONAL = /^(hi|hello|hey|how are you|what|ok|okay|yes|no|thanks|bye)$/i;
    if (words.length < 2 && t.length < 8) {
      setErr('Please enter a proper IELTS topic, e.g. "Climate change" or "Social media and youth".');
      return;
    }
    if (CONVERSATIONAL.test(t)) {
      setErr('That looks like a greeting, not an IELTS topic. Try something like "Technology in education" or "Urbanisation".');
      return;
    }
    setLoading(true); setErr(''); setResult(null);
    try {
      const res = await aiAPI.speakingFollowups(t, level);
      if (res?.error) setErr(res.error);
      else setResult(res);
    } catch (e) { setErr(e.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🎙️ AI Follow-up Questions</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="Speaking topic, e.g. Technology and education"
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        />
        <select value={level} onChange={e => setLevel(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13 }}>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button onClick={run} disabled={loading || !topic.trim()}
          style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--accent2,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Generating…' : 'Get Questions'}
        </button>
      </div>
      {err && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {result && (
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Follow-up Questions:</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {(result.follow_up_questions || []).map((q, i) => (
              <li key={i} style={{ marginBottom: 8, color: 'var(--text)' }}>{q}</li>
            ))}
          </ol>
          <div style={{ marginTop: 12, fontWeight: 600, marginBottom: 6 }}>Model Answer Cues:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {(result.model_cues || []).map((c, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
const SpeakingPage = ({ user }) => {
  const [subs, setSubs] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [interviewPart, setInterviewPart] = useState("part1");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef(null);

  const promptBank = {
    part1: [
      "Tell me about your hometown and what makes it special.",
      "What type of music do you listen to and why?",
      "How do you usually spend your weekends?",
    ],
    part2: [
      "Describe a memorable lesson you learned recently.",
      "Talk about a place you visited that exceeded expectations.",
      "Describe a person who motivated you to improve.",
    ],
    part3: [
      "How can schools better prepare students for real-world communication?",
      "Do you think technology improves public speaking skills? Why?",
      "Should communication skills be assessed more strictly in education?",
    ],
  };

  useEffect(() => {
    submissionsAPI.getStudentSubs(user.id)
      .then((res) => setSubs((res || []).filter((s) => s.task?.type === "speaking" || s.type === "speaking")))
      .catch(() => setSubs([]));
  }, [user.id]);

  useEffect(() => {
    const prompts = promptBank[interviewPart] || [];
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)] || "");
  }, [interviewPart]);

  useEffect(() => {
    const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalText += `${chunk} `;
        } else {
          interimText += `${chunk} `;
        }
      }
      if (finalText) {
        setTranscript((prev) => `${prev} ${finalText}`.trim());
      }
      setLiveTranscript(interimText.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setLiveTranscript("");
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const runAnalysis = async () => {
    setAnalysisError("");
    setAnalyzing(true);
    try {
      const result = await apiCall("/ai/speaking/analyze", {
        method: "POST",
        body: JSON.stringify({ transcript }),
      });
      if (result?.error) {
        setAnalysisError(result.error);
        setAnalysis(null);
      } else {
        setAnalysis(result);
        pushMistakeMemory(["speaking fluency", "speaking pronunciation", ...((result?.analysis?.suggestions) || [])]);
      }
    } catch (error) {
      setAnalysisError(error.message || "AI analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Speaking Submissions</div>
      <SpeakingFollowupPanel />
      <Card className="fade-up-2" style={{ marginBottom: 14, border: "1px solid rgba(20,108,114,.25)", background: "rgba(20,108,114,.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>AI Interviewer Simulation</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant={interviewPart === "part1" ? "primary" : "outline"} onClick={() => setInterviewPart("part1")}>Part 1</Btn>
            <Btn size="sm" variant={interviewPart === "part2" ? "primary" : "outline"} onClick={() => setInterviewPart("part2")}>Part 2</Btn>
            <Btn size="sm" variant={interviewPart === "part3" ? "primary" : "outline"} onClick={() => setInterviewPart("part3")}>Part 3</Btn>
          </div>
        </div>
        <div style={{ fontSize: 13, marginBottom: 10, color: "var(--text)" }}>{currentPrompt}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn size="sm" onClick={() => setCurrentPrompt((promptBank[interviewPart] || [""])[Math.floor(Math.random() * (promptBank[interviewPart] || [""]).length)])}>New Prompt</Btn>
          {speechSupported ? (
            <Btn size="sm" variant={isListening ? "danger" : "outline"} onClick={isListening ? stopListening : startListening}>
              {isListening ? "Stop Live Transcript" : "Start Live Transcript"}
            </Btn>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Speech-to-text not supported in this browser.</span>
          )}
        </div>
        {liveTranscript && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "var(--bg3)", fontSize: 12, color: "var(--muted)" }}>
            Live: {liveTranscript}
          </div>
        )}
      </Card>
      {subs.map(s => (
        <Card key={s.id} className="fade-up-2" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Task #{s.task_id}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{new Date(s.submitted_at).toLocaleString()}</div>
            </div>
            <StatusBadge status={s.status} />
          </div>
          {s.feedback_text && (
            <div style={{ marginTop: 14, padding: 14, background: "rgba(34,197,94,.06)", borderRadius: 10, fontSize: 13, color: "var(--muted)" }}>
              <span style={{ color: "var(--success)", fontWeight: 600, display: "block", marginBottom: 4 }}>Teacher Feedback</span>
              {s.feedback_text}
            </div>
          )}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            {s.file_url ? <a href={s.file_url} target="_blank" rel="noreferrer"><Btn size="sm" variant="outline">▶ Play Recording</Btn></a> : null}
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

      <Card className="fade-up-3" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>AI Speaking Check</div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Paste a transcript or rough draft and get an instant AI-style breakdown.</p>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="Paste your speaking transcript here…"
          style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn onClick={runAnalysis} disabled={!transcript.trim() || analyzing}>{analyzing ? "Analyzing…" : "Analyze Speaking"}</Btn>
        </div>
        {analysisError && <div style={{ marginTop: 10, color: "var(--danger)", fontSize: 12 }}>{analysisError}</div>}
        {analysis && (
          <div style={{ marginTop: 14, padding: 14, background: "var(--bg3)", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>AI Speaking Analysis</div>
              <Badge label={`Band ${analysis.band_estimate}`} color="success" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 10 }}>
              <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Fluency</div><div style={{ fontWeight: 700 }}>{analysis.analysis.fluency_score}/100</div></div>
              <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Pronunciation</div><div style={{ fontWeight: 700 }}>{analysis.analysis.pronunciation_score}/100</div></div>
              <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Grammar</div><div style={{ fontWeight: 700 }}>{analysis.analysis.grammar_score}/100</div></div>
              <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Filler words</div><div style={{ fontWeight: 700 }}>{analysis.analysis.filler_count}</div></div>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Suggestions</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text)", fontSize: 13 }}>
              {analysis.analysis.suggestions.map((item, index) => <li key={index} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// WRITING PAGE
// ─────────────────────────────────────────────
const WritingBrainstormPanel = () => {
  const [topic, setTopic] = useState('');
  const [stance, setStance] = useState('balanced');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!topic.trim()) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const res = await aiAPI.brainstormWriting(topic.trim(), stance);
      if (res?.error) setErr(res.error);
      else setResult(res);
    } catch (e) { setErr(e.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>💡 AI Essay Brainstorm</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="Essay topic, e.g. Social media effects on youth"
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        />
        <select value={stance} onChange={e => setStance(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13 }}>
          <option value="balanced">Balanced</option>
          <option value="agree">Agree</option>
          <option value="disagree">Disagree</option>
        </select>
        <button onClick={run} disabled={loading || !topic.trim()}
          style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--accent,#5b8def)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Thinking…' : 'Brainstorm'}
        </button>
      </div>
      {err && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>{err}</div>}
      {result && (
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Thesis:</div>
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontStyle: 'italic', color: 'var(--text)' }}>{result.thesis}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Body Ideas:</div>
          {(result.body_ideas || []).map((idea, i) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>{idea.point}</div>
              <div style={{ marginBottom: 4 }}>{idea.detail}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Example: {idea.example}</div>
            </div>
          ))}
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Key Vocabulary:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(result.vocabulary || []).map((v, i) => (
              <span key={i} style={{ background: 'rgba(91,141,239,.15)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 99, fontSize: 12 }}>{v}</span>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Conclusion: {result.conclusion_line}</div>
        </div>
      )}
    </div>
  );
};
const analyzeWriting = (text) => {
  if (!text || text.trim().length === 0) {
    return null; // No analysis when text is empty
  }
  
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 10) {
    return null; // Need at least 10 words for analysis
  }

  return {
    grammarScore: Math.min(100, Math.round(60 + (words / 10))),
    vocabularyScore: Math.min(100, Math.round(65 + (words / 20))),
    suggestions: [
      "Use more complex sentence structures",
      "Avoid repetition",
      "Add linking words (however, moreover)"
    ]
  };
};

const WritingPage = ({ user }) => {
  const [text, setText] = useState("");
  const [grammarResult, setGrammarResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [subs, setSubs] = useState([]);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState(null);
  const [rewriteError, setRewriteError] = useState("");

  useEffect(() => {
    submissionsAPI.getStudentSubs(user.id)
      .then((res) => setSubs((res || []).filter((s) => s.task?.type === "writing" || s.type === "writing")))
      .catch(() => setSubs([]));
  }, [user.id]);
  const words = text.split(/\s+/).filter(Boolean).length;

  const checkGrammar = async () => {
    setChecking(true);
    try {
      const result = await apiCall("/ai/writing/analyze", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (result?.error) {
        setGrammarResult(analyzeWriting(text));
      } else {
        setGrammarResult({
          grammarScore: result.analysis.grammar_score,
          vocabularyScore: Math.round(result.analysis.vocabulary_richness * 100),
          suggestions: result.analysis.suggestions,
          bandEstimate: result.band_estimate,
          transcript: result.transcript,
        });
        pushMistakeMemory(["writing grammar", "writing coherence", ...(result.analysis.suggestions || [])]);
      }
    } catch {
      setGrammarResult(analyzeWriting(text));
    } finally {
      setChecking(false);
    }
  };

  const rewriteBand9 = async () => {
    setRewriteError("");
    setRewriting(true);
    try {
      const result = await apiCall("/ai/writing/rewrite", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (result?.error) {
        setRewriteError(result.error);
        setRewriteResult(null);
      } else {
        setRewriteResult(result);
      }
    } catch (error) {
      setRewriteError(error.message || "Rewrite failed.");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Writing Submissions</div>
      <WritingBrainstormPanel />

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
            <Btn variant="outline" size="sm" onClick={rewriteBand9} disabled={rewriting || words < 80}>
              {rewriting ? "Rewriting..." : "✨ Band 9 Rewrite"}
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
            {grammarResult.bandEstimate && (
              <div style={{ marginBottom: 10, fontSize: 13, color: "var(--muted)" }}>Estimated IELTS band: <strong>{grammarResult.bandEstimate}</strong></div>
            )}
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

        {rewriteError && <div style={{ marginTop: 12, color: "var(--danger)", fontSize: 12 }}>{rewriteError}</div>}
        {rewriteResult && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(20,108,114,.08)", border: "1px solid rgba(20,108,114,.2)", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Band 9 Rewrite</div>
              <Badge label={`Target ${rewriteResult.target_band}`} color="success" />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Upgraded Version</div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{rewriteResult.rewritten}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Why this is stronger</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {(rewriteResult.upgrade_notes || []).map((item, idx) => <li key={idx} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
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
// DEBATE MODE PAGE
// ─────────────────────────────────────────────
const DebateModePage = () => {
  const topics = [
    "Universities should move all exams online.",
    "Social media does more harm than good for students.",
    "Governments should provide free public transport.",
    "AI will improve education more than human tutors.",
  ];
  const [topic, setTopic] = useState(topics[0]);
  const [argument, setArgument] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runDebateAnalysis = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await apiCall("/ai/debate/analyze", {
        method: "POST",
        body: JSON.stringify({ topic, argument }),
      });
      if (res?.error) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
      }
    } catch (e) {
      setError(e.message || "Debate analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>AI Debate Mode</div>
      <p style={{ color: "var(--muted)", marginBottom: 16, fontSize: 13 }}>Defend your viewpoint, then get instant argument-strength feedback and IELTS-style guidance.</p>

      <Card className="fade-up-2" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Debate Topic</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {topics.map((item) => (
            <Btn key={item} size="sm" variant={topic === item ? "primary" : "outline"} onClick={() => setTopic(item)}>{item.slice(0, 34)}...</Btn>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 10 }}>{topic}</div>
        <textarea
          value={argument}
          onChange={(e) => setArgument(e.target.value)}
          rows={8}
          placeholder="Write your stance with reasons and one example..."
          style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{argument.trim().split(/\s+/).filter(Boolean).length} words</span>
          <Btn onClick={runDebateAnalysis} disabled={!argument.trim() || analyzing}>{analyzing ? "Analyzing..." : "Analyze Argument"}</Btn>
        </div>
        {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{error}</div>}
      </Card>

      {result && (
        <Card className="fade-up-3" style={{ background: "rgba(20,108,114,.08)", border: "1px solid rgba(20,108,114,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Debate Analysis</div>
            <Badge label={`Band ${result.band_estimate}`} color="success" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 10 }}>
            <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Argument</div><div style={{ fontWeight: 700 }}>{result.analysis.argument_strength}/100</div></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Structure</div><div style={{ fontWeight: 700 }}>{result.analysis.structure_score}/100</div></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Vocabulary</div><div style={{ fontWeight: 700 }}>{result.analysis.vocabulary_score}/100</div></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)" }}>Connectors</div><div style={{ fontWeight: 700 }}>{result.analysis.connector_count}</div></div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Improvement tips</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {result.analysis.tips.map((tip, idx) => <li key={idx} style={{ marginBottom: 4 }}>{tip}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// AI COACH PAGE
// ─────────────────────────────────────────────
const AICoachPage = ({ user }) => {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const loadRisk = async () => {
    setLoading(true); setErr(''); setRisk(null);
    try {
      // Students call without student_id so backend uses their JWT identity.
      // Admins may pass a student_id via the admin panel instead.
      const res = await aiAPI.getRiskReport();
      if (res?.error) setErr(res.error);
      else setRisk(res);
    } catch (e) { setErr(e.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>AI Coach</div>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Personalized AI tools: brainstorm essays, generate speaking follow-ups, and assess learning risk.</p>

      <div style={{ marginBottom: 12 }}>
        <WritingBrainstormPanel />
        <SpeakingFollowupPanel />
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>Progress Risk</div>
          <Btn size="sm" onClick={loadRisk} disabled={loading}>{loading ? 'Analyzing…' : 'Generate Risk Report'}</Btn>
        </div>
        {err && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</div>}
        {risk && (
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{risk.risk?.level?.toUpperCase()} risk — {risk.risk?.score}/100</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{risk.risk?.recent_submissions} submissions · {risk.risk?.review_rate_percent}% reviewed · {risk.risk?.skill_diversity} skills active</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Actions:</div>
            <ul style={{ paddingLeft: 18 }}>{(risk.actions || []).map((a, i) => <li key={i} style={{ marginBottom: 6 }}>{a}</li>)}</ul>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// PROGRESS PAGE
// ─────────────────────────────────────────────
const ProgressPage = ({ user }) => {
  // Calculate progress dynamically based on user creation date
  const PROGRAM_DURATION_DAYS = 60;
  const userCreatedDate = new Date(user.created_at || new Date());
  const today = new Date();
  const daysSinceStart = Math.max(0, Math.floor((today - userCreatedDate) / (1000 * 60 * 60 * 24)) + 1);
  const currentDay = Math.min(daysSinceStart, PROGRAM_DURATION_DAYS);
  const progressPct = Math.round((currentDay / PROGRAM_DURATION_DAYS) * 100);
  const daysToGo = PROGRAM_DURATION_DAYS - currentDay;
  const progressPercentToGo = 100 - progressPct;
  
  // Skill data based on user data (default if not available)
  const skillData = [
    { label: "Listening", score: user.listening_band || 6.0, color: "var(--success)" },
    { label: "Reading",   score: user.reading_band || 6.0, color: "var(--warn)" },
    { label: "Writing",   score: user.writing_band || 6.0, color: "#a78bfa" },
    { label: "Speaking",  score: user.speaking_band || 6.0, color: "var(--accent)" },
  ];
  const overall = (skillData.reduce((a, b) => a + b.score, 0) / skillData.length).toFixed(1);
  const weakAreas = skillData.filter(s => s.score < 6.5).map(s => s.label);
  const memoryItems = Object.entries(loadMistakeMemory())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Day {currentDay} of {PROGRAM_DURATION_DAYS} · {progressPercentToGo}% to go</div>
            <ProgressBar pct={progressPct} height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
              <span>Day 1</span><span>Day {PROGRAM_DURATION_DAYS}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Band Score History</div>
        <BandHistoryChart studentId={user.id} />
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

      <Card className="fade-up-3" style={{ marginBottom: 20, background: "rgba(20,108,114,.06)", border: "1px solid rgba(20,108,114,.2)" }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Mistake Memory System</div>
        {memoryItems.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No recurring errors logged yet. Complete speaking/writing AI checks to build targeted drills.</div>
        ) : (
          memoryItems.map(([label, count]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 13, textTransform: "capitalize" }}>{label}</span>
              <Badge label={`${count}x`} color="danger" />
            </div>
          ))
        )}
      </Card>

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
// STUDENT – PLANS & ENROLLMENT
// ─────────────────────────────────────────────
const StudentPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [allPlans, mine] = await Promise.all([plansAPI.getAll(), plansAPI.getMy()]);
      setPlans(allPlans || []);
      setActivePlanId(mine?.active_plan?.plan_id || null);
    } catch (e) {
      setMsg(e.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const choosePlan = async (planId) => {
    try {
      setMsg("");
      await plansAPI.select(planId);
      setActivePlanId(planId);
      setMsg("Plan selected. Notification email sent to srsurajith@gmail.com.");
    } catch (e) {
      setMsg(e.message || "Plan selection failed");
    }
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Choose Your Training Plan</div>
      <p className="fade-up-2" style={{ color: "var(--muted)", marginBottom: 20 }}>
        Solo plans include 1:1 coaching every 2 days. Group plans require attendance from all enrolled members every 2 days.
      </p>

      {msg && <Card style={{ marginBottom: 14, border: "1px solid rgba(20,108,114,.35)", background: "rgba(20,108,114,.08)" }}>{msg}</Card>}

      {loading ? <Spinner /> : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {plans.map((p) => (
            <Card key={p.id} className="fade-up-3" style={{ border: activePlanId === p.id ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div className="playfair" style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
                <Badge label={`${p.duration_days} days`} color="accent" />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Mode: {p.session_type}</div>
              <div style={{ fontSize: 13, color: "var(--text)", minHeight: 64 }}>{p.description || "Structured IELTS roadmap with speaking, writing, reading, and listening."}</div>
              <div style={{ marginTop: 12 }}>
                <Btn onClick={() => choosePlan(p.id)} disabled={activePlanId === p.id} style={{ width: "100%" }}>
                  {activePlanId === p.id ? "Current Plan" : "Choose Plan"}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// STUDENT – GAMES ARENA
// ─────────────────────────────────────────────
const GamesArenaPage = () => {
  const quiz = [
    { q: "Choose the best connector: 'The train was late, ___ we still arrived on time.'", a: ["however", "although", "because"], c: 0 },
    { q: "Identify the noun phrase: 'The rapid growth of online classes'", a: ["rapid growth", "online", "classes"], c: 0 },
    { q: "Pick the formal alternative to 'kids'.", a: ["children", "buddies", "teens"], c: 0 },
    { q: "Which sentence is more concise?", a: ["Due to the fact that it rained,", "Because it rained,"], c: 1 },
  ];

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);

  const current = quiz[idx];

  const pick = (optIdx) => {
    if (answered) return;
    setSelected(optIdx);
    setAnswered(true);
    if (optIdx === current.c) setScore((s) => s + 1);
  };

  const next = () => {
    setAnswered(false);
    setSelected(null);
    setIdx((i) => (i + 1) % quiz.length);
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>IELTS Games Arena</div>
      <p className="fade-up-2" style={{ color: "var(--muted)", marginBottom: 16 }}>Build grammar, vocabulary, and concise writing reflexes with fast drills.</p>

      <Card className="fade-up-3" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Quick Drill</div>
          <Badge label={`Score ${score}/${quiz.length}`} color="success" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{current.q}</div>
        <div style={{ display: "grid", gap: 8 }}>
          {current.a.map((opt, i) => {
            const isCorrect = answered && i === current.c;
            const isWrong = answered && selected === i && i !== current.c;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${isCorrect ? "var(--success)" : isWrong ? "var(--danger)" : "var(--border)"}`,
                  background: isCorrect ? "rgba(47,133,90,.12)" : isWrong ? "rgba(197,48,48,.1)" : "var(--bg3)",
                  color: "var(--text)",
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12 }}><Btn onClick={next} variant="outline">Next Drill</Btn></div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// MOCK TEST PAGE
// ─────────────────────────────────────────────
const MOCK_TEST_BANK = {
  writing: {
    title: "Writing Task 2: Public Space Priority",
    duration: 40,
    wordTarget: 250,
    prompt: "Some people argue that city budgets should prioritize public parks and libraries rather than sports arenas. Discuss both views and give your opinion.",
    checklist: [
      "State your position clearly in the introduction.",
      "Use one paragraph per main argument.",
      "Support each argument with a practical example.",
      "Write a short conclusion that reinforces your view."
    ]
  },
  reading: {
    title: "Reading Passage: The Night Shift Effect",
    duration: 20,
    prompt: "A workplace study tracked 600 hospital employees over eight years. Researchers found that workers on rotating shifts reported lower sleep quality and higher stress. However, teams with predictable rosters and recovery days showed better concentration scores. The report recommends fixed schedules, mandatory quiet rooms, and hydration reminders during overnight hours.",
    checklist: [
      "TRUE/FALSE: The study lasted fewer than five years.",
      "TRUE/FALSE: Predictable rosters improved concentration.",
      "Choose TWO recommendations from the passage.",
      "Write a one-sentence summary in your own words."
    ]
  },
  listening: {
    title: "Listening Notes: Campus Orientation",
    duration: 15,
    prompt: "You hear a student advisor explain orientation week. New students must collect ID cards before Wednesday, register for workshops online, and join one study group session. The library tour starts at 11:30, while language support appointments open on Friday.",
    checklist: [
      "What must be collected before Wednesday?",
      "How should workshops be registered?",
      "At what time does the library tour begin?",
      "On which day do language appointments open?"
    ]
  },
  speaking: {
    title: "Speaking Part 2: A Skill You Learned",
    duration: 10,
    prompt: "Describe a skill you learned recently. You should say when you started learning it, what challenges you faced, how you practiced, and why it is useful for your future.",
    checklist: [
      "Speak for 1 to 2 minutes.",
      "Use specific examples instead of general statements.",
      "Include one difficulty and how you solved it.",
      "Finish with a future goal."
    ]
  }
};

const MockTestPage = () => {
  const [activeSkill, setActiveSkill] = useState("writing");
  const skill = MOCK_TEST_BANK[activeSkill];
  const [timeLeft, setTimeLeft] = useState(skill.duration * 60);
  const [testText, setTestText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTimeLeft(skill.duration * 60);
    setSubmitted(false);
    setTestText("");
  }, [activeSkill, skill.duration]);

  useEffect(() => {
    if (submitted) return;
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
  }, [activeSkill, submitted]);

  const format = (s) => `${Math.floor(s/60)}:${String(s % 60).padStart(2, "0")}`;
  const words = testText.split(/\s+/).filter(Boolean).length;
  const requiresEssay = activeSkill === "writing";
  const minWords = requiresEssay ? skill.wordTarget : 40;
  const readyToSubmit = words >= minWords;

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Mock Test Studio
      </div>

      <div className="fade-up-2" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.keys(MOCK_TEST_BANK).map((k) => (
          <Btn
            key={k}
            size="sm"
            variant={activeSkill === k ? "primary" : "outline"}
            onClick={() => setActiveSkill(k)}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </Btn>
        ))}
      </div>

      <Card className="fade-up-3" style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(20,108,114,.12),rgba(214,148,41,.10))", border: "1px solid rgba(20,108,114,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{skill.title}</div>
            <div className="playfair" style={{ fontSize: 36, fontWeight: 700, color: timeLeft < 300 ? "var(--danger)" : "var(--warn)", fontVariantNumeric: "tabular-nums" }}>
              {format(timeLeft)}
            </div>
          </div>
          <ProgressRing pct={Math.round((timeLeft / (skill.duration * 60)) * 100)} size={100} color={timeLeft < 120 ? "var(--danger)" : "var(--accent)"} />
        </div>
      </Card>

      <Card className="fade-up-4">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{skill.title}</div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          {skill.prompt}
        </p>
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: "rgba(20,108,114,.08)", border: "1px solid rgba(20,108,114,.2)" }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Checklist</div>
          {skill.checklist.map((item, idx) => (
            <div key={idx} style={{ fontSize: 12, color: "var(--text)", marginBottom: 5 }}>• {item}</div>
          ))}
        </div>
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
            {words} words {readyToSubmit ? "✓" : `(${Math.max(minWords - words, 0)} more)`}
          </span>
          <Btn onClick={() => setSubmitted(true)} disabled={submitted || !readyToSubmit}>
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
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    usersAPI.getStudents()
      .then((res) => {
        const ranked = visibleStudents(res)
          .map((u) => ({
            name: u.name,
            streak: u.streak || 0,
            score: u.score || 0,
            points: Math.round((u.score || 0) * 10 + (u.streak || 0) * 4),
          }))
          .sort((a, b) => b.points - a.points)
          .map((u, index) => ({ ...u, rank: index + 1 }));
        setLeaderboardData(ranked);
      })
      .catch(() => setLeaderboardData([]));
  }, []);

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
const LiveClassPage = ({ user }) => {
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    plansAPI.getMy().then((res) => setActivePlan(res?.active_plan?.plan || null)).catch(() => setActivePlan(null));
  }, []);

  const meetingMode = activePlan?.session_type === "group" ? "Group" : "Solo";
  const cadenceText = "Every 2 days";
  const meetingLink = user.zoom_link || `https://meet.jit.si/ielts-${user.id}-session`;
  const topics = [
    "Speaking Band Boost Lab",
    "Writing Structure Clinic",
    "Reading Speed and Accuracy",
    "Listening Trap Questions"
  ];
  const upcoming = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i * 2);
    return {
      date: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      time: "7:00 PM",
      topic: topics[i % topics.length]
    };
  });

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Live Sessions 🎥</div>

      <Card className="fade-up-2" style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(20,108,114,.12),rgba(214,148,41,.08))", border: "1px solid rgba(20,108,114,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎥</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{activePlan?.name || "No plan selected yet"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{meetingMode} training · {cadenceText}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
            {meetingMode === "Group" ? "All users in this plan are requested to join each session." : "1:1 session with teacher."}
          </div>
        </div>
        <a href={meetingLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <button style={{ background: "#2D8CFF", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", width: "100%" }}>
            Join Live Meeting Room
          </button>
        </a>
      </Card>

      <Card className="fade-up-3">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Upcoming Sessions</div>
        {upcoming.map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < upcoming.length - 1 ? "1px solid var(--border)" : "none" }}>
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
};

// ─────────────────────────────────────────────
// ADMIN – OVERVIEW
// ──────────────────────────────────��──────────
const AdminHome = () => {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [pending, setPending] = useState([]);
  const [homeError, setHomeError] = useState("");

  useEffect(() => {
    Promise.allSettled([studentsAPI.getAll(), plansAPI.getAll(), submissionsAPI.getPending()])
      .then(([studentsRes, plansRes, pendingRes]) => {
        const loadedStudents = studentsRes.status === "fulfilled" ? visibleStudents(studentsRes.value) : [];
        const loadedPlans = plansRes.status === "fulfilled" ? (plansRes.value || []) : [];
        const loadedPending = pendingRes.status === "fulfilled" ? (pendingRes.value || []) : [];
        setStudents(loadedStudents);
        setPlans(loadedPlans);
        setPending(loadedPending);
        if (studentsRes.status === "rejected" || plansRes.status === "rejected" || pendingRes.status === "rejected") {
          setHomeError("Some dashboard widgets could not be loaded. Backend may be restarting.");
        } else {
          setHomeError("");
        }
      });
  }, []);

  const avgScore = students.length ? Math.round(students.reduce((acc, s) => acc + (s.score || 0), 0) / students.length) : 0;
  const stats = [
    { label: "Total Students", value: students.length, icon: "👥", color: "var(--accent)" },
    { label: "Active Plans", value: plans.length, icon: "📋", color: "var(--success)" },
    { label: "Pending Review", value: pending.length, icon: "🔍", color: "var(--warn)" },
    { label: "Avg Score", value: avgScore, icon: "🎯", color: "var(--gold)" },
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

      {homeError && (
        <Card style={{ marginBottom: 14, border: "1px solid rgba(197,48,48,.35)", background: "rgba(197,48,48,.08)" }}>
          <div style={{ fontSize: 12 }}>{homeError}</div>
        </Card>
      )}

      <Card className="fade-up-3">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Students at a Glance</div>
        {students.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>No student records yet. Add students from the Students tab.</div>
        )}
        {students.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0
            }}>{s.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.email}</div>
            </div>
            <div style={{ width: 100, fontSize: 11, color: "var(--muted)" }}>🔥 {s.streak || 0} streak</div>
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
const StudentAIRiskPanel = ({ studentId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const res = await aiAPI.getRiskReport(studentId);
      if (res?.error) setErr(res.error);
      else setReport(res);
    } catch (e) { setErr(e.message || 'Failed'); }
    setLoading(false);
  };

  useEffect(() => { setReport(null); }, [studentId]);

  const riskColor = { high: 'var(--danger,#f87171)', moderate: 'var(--warn,#fbbf24)', low: 'var(--success,#34d399)' };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>AI Progress Risk Report</div>
      {!report && !loading && (
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent,#5b8def)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Generate Risk Report
        </button>
      )}
      {loading && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Analysing…</div>}
      {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
      {report && (
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: riskColor[report.risk?.level] || 'var(--text)', fontSize: 15, textTransform: 'uppercase' }}>
              {report.risk?.level} RISK
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>score: {report.risk?.score}/100</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
            {report.risk?.recent_submissions} submissions · {report.risk?.review_rate_percent}% reviewed · {report.risk?.skill_diversity} skills active
          </div>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Recommended Actions:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {(report.actions || []).map((a, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{a}</li>
            ))}
          </ul>
          <button onClick={() => setReport(null)} style={{ marginTop: 10, fontSize: 11, background: 'none', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}
    </div>
  );
};
const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tag, setTag] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState("");

  const weakAreasToList = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
    return [];
  };

  const refreshStudents = async () => {
    setLoadingStudents(true);
    setLoadError("");
    try {
      const res = await studentsAPI.getAll();
      setStudents(visibleStudents(res));
      if (selected) {
        const updatedSelected = visibleStudents(res).find((student) => student.id === selected.id) || null;
        setSelected(updatedSelected);
      }
    } catch (error) {
      setStudents([]);
      setLoadError(error.message || "Unable to load students right now.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    refreshStudents();
    plansAPI.getAll().then((res) => setPlans(Array.isArray(res) ? res : [])).catch(() => setPlans([]));
  }, []);

  const [formState, setFormState] = useState({ name: "", email: "", password: "", plan_id: "", zoom_link: "" });

  const handleCreateStudent = async () => {
    if (!formState.name.trim() || !formState.email.trim() || !formState.password.trim()) {
      setAddError("Name, email, and password are required.");
      return;
    }

    setAddError("");
    try {
      const response = await studentsAPI.create({
        name: formState.name.trim(),
        email: formState.email.trim(),
        password: formState.password,
        plan_id: formState.plan_id || undefined,
        zoom_link: formState.zoom_link.trim(),
      });
      setCreatedCredentials(response?.login_credentials || null);
      setShowAdd(false);
      setFormState({ name: "", email: "", password: "", plan_id: "", zoom_link: "" });
      await refreshStudents();
    } catch (error) {
      setAddError(error.message || "Failed to create student.");
    }
  };

  const addWeakArea = async () => {
    if (!selected || !tag.trim()) return;
    const existing = weakAreasToList(selected.weak_areas);
    const merged = Array.from(new Set([...existing, tag.trim()]));
    await studentsAPI.update(selected.id, { weak_areas: merged });
    await refreshStudents();
    setTag("");

  };

  const resetPassword = async () => {
    if (!selected) return;
    if (!newPass.trim() || newPass.trim().length < 6) {
      setPassMsg("Password must be at least 6 characters.");
      return;
    }
    try {
      const result = await studentsAPI.resetPassword(selected.id, newPass.trim());
      setPassMsg(`Password updated for ${result.email}.`);
      setNewPass("");
    } catch (error) {
      setPassMsg(error.message || "Failed to reset password.");
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    await studentsAPI.delete(studentId);
    setSelected(null);
    await refreshStudents();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700 }}>Students</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Manage student accounts, plans, passwords, and weak areas.
          </div>
        </div>
        <Btn onClick={() => { setShowAdd((v) => !v); setAddError(""); setCreatedCredentials(null); }}>
          {showAdd ? "Close Add Form" : "+ Add Student"}
        </Btn>
      </div>

      {showAdd && (
        <Card className="fade-up-2" style={{ marginBottom: 16, border: "1px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700 }}>Add Student</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Creates a real login for a student</div>
          </div>

          {createdCredentials && (
            <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: "rgba(47,133,90,.08)", border: "1px solid rgba(47,133,90,.25)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--success)" }}>Student created successfully</div>
              <div style={{ fontSize: 13 }}>Email: {createdCredentials.email}</div>
              <div style={{ fontSize: 13 }}>Password: {createdCredentials.password}</div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Name *</label>
              <input value={formState.name} onChange={(e) => setFormState((c) => ({ ...c, name: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }} placeholder="Student name" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Email *</label>
              <input value={formState.email} onChange={(e) => setFormState((c) => ({ ...c, email: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }} placeholder="student@email.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Password *</label>
              <input type="password" value={formState.password} onChange={(e) => setFormState((c) => ({ ...c, password: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }} placeholder="Create a password" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Plan (optional)</label>
              <select value={formState.plan_id} onChange={(e) => setFormState((c) => ({ ...c, plan_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }}>
                <option value="">No plan</option>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Zoom / Jitsi Link (optional)</label>
              <input value={formState.zoom_link} onChange={(e) => setFormState((c) => ({ ...c, zoom_link: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }} placeholder="https://meet.jit.si/room" />
            </div>
          </div>

          {addError && <div style={{ marginTop: 10, color: "var(--danger)", fontSize: 12 }}>{addError}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn onClick={handleCreateStudent}>Create Student</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {loadingStudents && (
        <Card style={{ marginBottom: 16 }}>
          Loading students...
        </Card>
      )}

      {loadError && (
        <Card style={{ marginBottom: 16, border: "1px solid rgba(197,48,48,.35)", background: "rgba(197,48,48,.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load students</div>
          <div style={{ fontSize: 12 }}>{loadError}</div>
        </Card>
      )}

      {!loadingStudents && students.length === 0 && (
        <Card style={{ marginBottom: 16, textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No students yet</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Use the Add Student button in the top right to create the first account.</div>
          <Btn onClick={() => setShowAdd(true)}>+ Add Student</Btn>
        </Card>
      )}

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: selected ? "1fr 1fr" : "1fr" }}>
        <div>
          {students.map(s => (
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
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.role}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 12 }}>🔥 {s.streak}</span>
                    <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>Score: {s.score}</span>
                  </div>
                </div>
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
                  { l: "Role", v: selected.role, c: "var(--accent)" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, minWidth: 80, textAlign: "center", background: "var(--bg3)", borderRadius: 10, padding: "12px 8px" }}>
                  <div style={{ fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Weak Areas</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {weakAreasToList(selected.weak_areas).map((w, i) => <Badge key={i} label={w} color="danger" />)}
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Add Weak Area Tag</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. Grammar" style={{
                flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none"
              }} />
              <Btn size="sm" onClick={addWeakArea}>Add</Btn>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Reset Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={newPass} onChange={(e) => setNewPass(e.target.value)} type="password" placeholder="New password" style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none" }} />
                  <Btn size="sm" variant="outline" onClick={resetPassword}>Reset</Btn>
                </div>
              </div>
              {passMsg && <div style={{ fontSize: 12, color: passMsg.startsWith("Password updated") ? "var(--success)" : "var(--danger)" }}>{passMsg}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn style={{ width: "100%" }} variant="purple">Assign New Plan</Btn>
                <Btn style={{ width: "100%" }} variant="danger" onClick={() => deleteStudent(selected.id)}>Delete Student</Btn>
              </div>
            </div>
            {/* AI Risk Report for selected student */}
            <StudentAIRiskPanel studentId={selected.id} />
          </Card>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ADMIN – PLANS
// ─────────────────────────────────────────────
const AdminPlans = ({ setPage }) => {
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [assignPlanId, setAssignPlanId] = useState(null);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignReminderDays, setAssignReminderDays] = useState(3);
  const [planName, setPlanName] = useState("");
  const [planDays, setPlanDays] = useState(60);
  const [sessionType, setSessionType] = useState("solo");
  const [description, setDescription] = useState("");
  const [planError, setPlanError] = useState("");
  const [planMsg, setPlanMsg] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  const refreshPlans = async () => {
    const [res, activeAssignments] = await Promise.all([plansAPI.getAll(), plansAPI.getAssignments().catch(() => [])]);
    setPlans(res || []);
    setAssignments(activeAssignments || []);
  };

  useEffect(() => {
    refreshPlans().catch((error) => {
      setPlans([]);
      setPlanError(error.message || "Failed to load plans.");
    });
    studentsAPI.getAll()
      .then((rows) => setStudents(visibleStudents(rows)))
      .catch(() => setStudents([]));
  }, []);

  const openConfigureTasks = (planId) => {
    localStorage.setItem("admin_tasks_selected_plan", String(planId));
    if (typeof setPage === "function") {
      setPage("admin-tasks");
    }
  };

  const openAssign = (planId) => {
    setAssignPlanId(planId);
    setAssignStudentId("");
    setAssignDueDate("");
    setAssignReminderDays(3);
    setPlanError("");
    setPlanMsg("");
  };

  const runReminders = async () => {
    setSendingReminders(true);
    setPlanError("");
    setPlanMsg("");
    try {
      const res = await plansAPI.runReminders({ days_ahead: 3 });
      setPlanMsg(`Sent ${res?.count || 0} reminder notification(s).`);
      await refreshPlans();
    } catch (error) {
      setPlanError(error.message || "Failed to send reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  const assignPlan = async () => {
    if (!assignPlanId || !assignStudentId) {
      setPlanError("Select a student before assigning a plan.");
      return;
    }
    setSavingPlan(true);
    setPlanError("");
    setPlanMsg("");
    try {
      await plansAPI.assign(Number(assignStudentId), Number(assignPlanId), {
        due_date: assignDueDate || null,
        reminder_days: Number(assignReminderDays) || 3,
      });
      const student = students.find((s) => Number(s.id) === Number(assignStudentId));
      const plan = plans.find((p) => Number(p.id) === Number(assignPlanId));
      setPlanMsg(`Assigned ${plan?.name || "plan"} to ${student?.name || "student"}${assignDueDate ? `, due ${assignDueDate}.` : "."}`);
      setAssignPlanId(null);
      setAssignStudentId("");
      setAssignDueDate("");
    } catch (error) {
      setPlanError(error.message || "Failed to assign plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const createNewPlan = async () => {
    setSavingPlan(true);
    setPlanError("");
    setPlanMsg("");
    try {
      await plansAPI.create({
        name: planName,
        duration_days: Number(planDays),
        session_type: sessionType,
        description,
      });
      setShowNew(false);
      setPlanName("");
      setPlanDays(60);
      setSessionType("solo");
      setDescription("");
      setPlanMsg("Plan created successfully.");
      await refreshPlans();
    } catch (error) {
      setPlanError(error.message || "Plan creation failed.");
    } finally {
      setSavingPlan(false);
    }
  };

  const inp = {
    width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none"
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="playfair fade-up" style={{ fontSize: 22, fontWeight: 700 }}>Plans</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <DotMenu
            items={[
              { icon: "Refresh", label: "Refresh Plans", action: refreshPlans },
              { icon: "Bell", label: sendingReminders ? "Sending Reminders..." : "Send Due Reminders", action: runReminders, disabled: sendingReminders },
            ]}
          />
          <Btn onClick={() => setShowNew(e => !e)}>+ New Plan</Btn>
        </div>
      </div>

      {planError && (
        <Card style={{ marginBottom: 14, border: "1px solid rgba(197,48,48,.35)", background: "rgba(197,48,48,.08)", fontSize: 12 }}>
          {planError}
        </Card>
      )}
      {planMsg && (
        <Card style={{ marginBottom: 14, border: "1px solid rgba(47,133,90,.35)", background: "rgba(47,133,90,.08)", fontSize: 12 }}>
          {planMsg}
        </Card>
      )}

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
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Session Type</label>
              <select style={inp} value={sessionType} onChange={e => setSessionType(e.target.value)}>
                <option value="solo">solo</option>
                <option value="group">group</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Description / Pricing</label>
              <textarea rows={3} style={inp} value={description} onChange={e => setDescription(e.target.value)} placeholder="INR 10000 for 60 days, every 2 days session" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={createNewPlan} disabled={!planName.trim() || savingPlan}>{savingPlan ? "Creating..." : "Create Plan"}</Btn>
              <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        {plans.map(p => (
          <Card key={p.id} className="fade-up-2">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="playfair" style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</div>
              <Badge label={`${p.duration_days} days`} color="accent" />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Mode: {p.session_type}</div>
            <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 14 }}>{p.description}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="outline" onClick={() => openConfigureTasks(p.id)}>Configure Tasks</Btn>
              <Btn size="sm" onClick={() => openAssign(p.id)}>Assign</Btn>
              <DotMenu
                size="sm"
                items={[
                  { icon: "Tasks", label: "Configure Tasks", action: () => openConfigureTasks(p.id) },
                  { icon: "Assign", label: "Assign Student", action: () => openAssign(p.id) },
                ]}
              />
            </div>
          </Card>
        ))}
      </div>

      {assignPlanId && (
        <Card style={{ marginTop: 16, border: "1px solid var(--accent)" }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Assign Plan to Student</div>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Student</label>
          <select
            style={{ ...inp, marginBottom: 12 }}
            value={assignStudentId}
            onChange={(e) => setAssignStudentId(e.target.value)}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Due Date</label>
              <input
                type="date"
                style={inp}
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Reminder Days Before</label>
              <input
                type="number"
                min="0"
                style={inp}
                value={assignReminderDays}
                onChange={(e) => setAssignReminderDays(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={assignPlan} disabled={savingPlan}>{savingPlan ? "Assigning..." : "Assign Plan"}</Btn>
            <Btn variant="ghost" onClick={() => setAssignPlanId(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {assignments.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Active Assignments</div>
          <div style={{ display: "grid", gap: 10 }}>
            {assignments.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: 12, borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.student_name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{item.plan_name} · Day {item.current_day}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    Start {item.start_date}{item.due_date ? ` · Due ${item.due_date}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.needs_reminder ? "var(--warn)" : "var(--success)" }}>
                    {item.days_remaining == null ? "No deadline" : `${item.days_remaining} day(s) left`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    Reminder window: {item.reminder_days ?? 3} day(s)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// ADMIN – REVIEW (FEEDBACK)
// ─────────────────────────────────────────────
const AdminReview = () => {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pending, setPending] = useState([]);

  useEffect(() => {
    submissionsAPI.getPending().then((res) => setPending(res || [])).catch(() => setPending([]));
  }, []);

  const saveFeedback = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await feedbackAPI.create(selected.id, feedback, feedbackFile);
      const refreshed = await submissionsAPI.getPending();
      setPending(refreshed || []);
      setSelected(null);
      setFeedback("");
      setFeedbackFile(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Review Submissions</div>
      <p className="fade-up-2" style={{ color: "var(--muted)", marginBottom: 20 }}>{pending.length} submissions awaiting feedback</p>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: selected ? "1fr 1fr" : "1fr" }}>
        <div>
          {pending.map((s) => (
            <Card key={s.id} className="fade-up-3" style={{ marginBottom: 14, cursor: "pointer", border: selected?.id === s.id ? "1px solid var(--accent)" : "1px solid var(--border)" }}
              onClick={() => { setSelected(s); setFeedback(s.feedback_text || ""); setFeedbackFile(null); }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>Task #{s.task_id}</div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                <span>📅 {new Date(s.submitted_at).toLocaleString()}</span>
                <TaskTypeBadge type={s.task?.type || "writing"} />
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
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Task #{selected.task_id}</div>
              <div style={{ display: "flex", gap: 8 }}><TaskTypeBadge type={selected.task?.type || "writing"} /><StatusBadge status={selected.status} /></div>
            </div>
            {(selected.task?.type || selected.type) === "speaking" && (
              <div style={{ marginBottom: 14 }}>
                <Btn size="sm" variant="outline" onClick={() => selected.file_url && window.open(selected.file_url, "_blank", "noopener,noreferrer")} disabled={!selected.file_url}>▶ Play Student Recording</Btn>
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
              <input type="file" accept="audio/*" style={{ fontSize: 13, color: "var(--muted)" }} onChange={(e) => setFeedbackFile(e.target.files?.[0] || null)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={saveFeedback} disabled={saving}>
                {saving ? "Saving…" : "Save Feedback"}
              </Btn>
              <Btn variant="outline" size="sm" onClick={saveFeedback} disabled={saving}>Mark Reviewed</Btn>
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
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", type: "speaking", description: "", duration: "20 min" });
  const [taskError, setTaskError] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [creatingStarterPlan, setCreatingStarterPlan] = useState(false);

  useEffect(() => {
    plansAPI.getAll()
      .then((res) => {
        const loadedPlans = res || [];
        setPlans(loadedPlans);
        if (!loadedPlans.length) return;

        const preferredId = Number(localStorage.getItem("admin_tasks_selected_plan") || 0);
        const matched = loadedPlans.find((plan) => plan.id === preferredId);
        if (matched) {
          setSelectedPlan(matched.id);
          localStorage.removeItem("admin_tasks_selected_plan");
        } else if (!selectedPlan) {
          setSelectedPlan(loadedPlans[0].id);
        }
      })
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;
    apiCall(`/tasks/plan/${selectedPlan}/day/${day}`)
      .then((res) => setTasks(res?.tasks || []))
      .catch(() => setTasks([]));
  }, [selectedPlan, day]);

  const createTask = async () => {
    if (!selectedPlan) {
      setTaskError("Select a plan first.");
      return;
    }
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      setTaskError("Title and description are required.");
      return;
    }
    setSavingTask(true);
    setTaskError("");
    try {
      await apiCall("/tasks/", {
        method: "POST",
        body: JSON.stringify({
          plan_id: selectedPlan,
          day_number: day,
          type: taskForm.type,
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          duration: taskForm.duration.trim() || "20 min",
          difficulty: day < 15 ? "beginner" : day < 45 ? "intermediate" : "advanced",
        }),
      });
      setTaskForm({ title: "", type: "speaking", description: "", duration: "20 min" });
      setShowCreate(false);
      const refreshed = await apiCall(`/tasks/plan/${selectedPlan}/day/${day}`);
      setTasks(refreshed?.tasks || []);
    } catch (error) {
      setTaskError(error.message || "Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  const createStarterPlan = async () => {
    setCreatingStarterPlan(true);
    setTaskError("");
    try {
      const created = await plansAPI.create({
        name: "Starter IELTS Plan",
        duration_days: 30,
        session_type: "solo",
        description: "Auto-created starter plan from Task Editor.",
      });
      const allPlans = await plansAPI.getAll();
      const normalized = Array.isArray(allPlans) ? allPlans : [];
      setPlans(normalized);
      setSelectedPlan(created?.id || normalized[0]?.id || null);
      setShowCreate(true);
    } catch (error) {
      setTaskError(error.message || "Could not create starter plan.");
    } finally {
      setCreatingStarterPlan(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    const refreshed = await apiCall(`/tasks/plan/${selectedPlan}/day/${day}`);
    setTasks(refreshed?.tasks || []);
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Task Editor</div>
      <Card className="fade-up-2" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Select Plan and Day</div>
        {plans.length === 0 && (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", fontSize: 12, color: "var(--muted)" }}>
            No plan exists yet. Create a starter plan directly here.
            <div style={{ marginTop: 8 }}>
              <Btn size="sm" onClick={createStarterPlan} disabled={creatingStarterPlan}>{creatingStarterPlan ? "Creating..." : "Create Starter Plan"}</Btn>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {plans.map((plan) => (
            <Btn key={plan.id} size="sm" variant={selectedPlan === plan.id ? "primary" : "outline"} onClick={() => setSelectedPlan(plan.id)}>
              {plan.name}
            </Btn>
          ))}
        </div>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Add or manage the day’s task pack.</div>
          <Btn size="sm" onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Close" : "+ Add Task"}</Btn>
        </div>
      </Card>

      {showCreate && (
        <Card className="fade-up-3" style={{ marginBottom: 20, border: "1px solid var(--accent)" }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Create Task for Day {day}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Title</label>
              <input value={taskForm.title} onChange={(e) => setTaskForm((c) => ({ ...c, title: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }} placeholder="Day 1 Speaking Lab" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Type</label>
              <select value={taskForm.type} onChange={(e) => setTaskForm((c) => ({ ...c, type: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }}>
                <option value="speaking">speaking</option>
                <option value="writing">writing</option>
                <option value="reading">reading</option>
                <option value="listening">listening</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Duration</label>
              <input value={taskForm.duration} onChange={(e) => setTaskForm((c) => ({ ...c, duration: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)" }} placeholder="20 min" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Description</label>
              <textarea rows={4} value={taskForm.description} onChange={(e) => setTaskForm((c) => ({ ...c, description: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)", resize: "vertical" }} placeholder="Add the prompt, instructions, and scoring target." />
            </div>
          </div>
          {taskError && <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{taskError}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn onClick={createTask} disabled={savingTask}>{savingTask ? "Saving…" : "Create Task"}</Btn>
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div className="fade-up-3">
        {tasks.map((t) => (
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
                <Btn size="sm" variant="outline" onClick={async () => {
                  const title = window.prompt("Task title", t.title);
                  if (title == null) return;
                  const description = window.prompt("Task description", t.description || t.desc || "") ?? "";
                  await apiCall(`/tasks/${t.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ title: title.trim(), description: description.trim() }),
                  });
                  const refreshed = await apiCall(`/tasks/plan/${selectedPlan}/day/${day}`);
                  setTasks(refreshed?.tasks || []);
                }}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => deleteTask(t.id)}>Remove</Btn>
              </div>
            </div>
          </Card>
        ))}
        <Btn style={{ marginTop: 8 }} onClick={() => setShowCreate(true)}>+ Add Task to Day {day}</Btn>
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

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token && !user) {
      // Verify token is still valid by checking user data
      authAPI.getProfile()
        .then(res => {
          if (res && res.user) {
            const usr = res.user;
            setUser({
              id: usr.id, name: usr.name, email: usr.email, role: usr.role,
              streak: usr.streak || 0, score: usr.score || 0,
              created_at: usr.created_at || null,
              listening_band: usr.listening_band || null,
              reading_band: usr.reading_band || null,
              writing_band: usr.writing_band || null,
              speaking_band: usr.speaking_band || null,
              weak_areas: usr.weak_areas || '',
            });
            setPage(usr.role === "admin" ? "admin-home" : "dashboard");
          }
        })
        .catch(() => {
          localStorage.removeItem("jwt_token");
        });
    }
  }, [user]);

  const handleLogin = (u) => {
    setUser(u);
    setPage(u.role === "admin" ? "admin-home" : "dashboard");
  };

  const handleLogout = () => { 
    localStorage.removeItem("jwt_token");
    setUser(null); 
    setPage("dashboard"); 
  };

  if (!user) return <><GlobalStyles /><LoginPage onLogin={handleLogin} /></>;

  const studentPages = {
    dashboard: <StudentDashboard user={user} />,
    vocabulary: <VocabularyPage user={user} />,
    plans:     <StudentPlansPage user={user} />,
    tasks:     <TasksPage user={user} />,
    speaking:  <SpeakingPage user={user} />,
    writing:   <WritingPage user={user} />,
    'ai-coach': <AICoachPage user={user} />,
    debate:    <DebateModePage />,
    progress:  <ProgressPage user={user} />,
    mocktest:  <MockTestPage />,
    games:     <StudentGamesPage />,
    leaderboard: <LeaderboardPage />,
    liveclass: <LiveSessionsPage user={user} />,
    quizzes:   <QuizzesPage />,
    resources: <ResourcesPage />,
  };
  const adminPages = {
    "admin-home":     <AdminHome />,
    "admin-students": <AdminStudentsPage />,
    "admin-job-tokens": <AdminJobTokens />,
    "admin-audits":   <ReviewAudits />,
    "admin-plans":    <AdminPlans setPage={setPage} />,
    "admin-tasks":    <AdminTasks />,
    "admin-review":        <AdminReview />,
    "admin-sessions":      <AdminSessionsMgr />,
    "admin-resources":     <AdminResourcesMgr />,
    "admin-quizzes":       <AdminQuizBuilder />,
  };
  const pages = user.role === "admin" ? adminPages : studentPages;
  const content = pages[page] || <div style={{ color: "var(--muted)" }}>Page not found</div>;
  const quickMeetUrl = user.zoom_link || `https://meet.jit.si/ielts-quick-meet-${user.id}`;

  const openQuickMeet = () => {
    window.open(quickMeetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <GlobalStyles />
        <DebugBanner />
        <div style={{ marginRight: 18 }}>
          <React.Suspense fallback={null}>
            <NotificationCenter />
          </React.Suspense>
        </div>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
          <main style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "32px 32px 32px", minHeight: "100vh", overflowY: "auto" }}>
            <div style={{ maxWidth: 860 }}>
              {content}
            </div>
          </main>
        </div>
        <ThemeToggle />
        <button
          onClick={openQuickMeet}
          title="Start a quick meet"
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 40,
            width: 58,
            height: 58,
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: "#fff",
            boxShadow: "0 16px 34px rgba(20,108,114,.28)",
            fontSize: 24,
            display: "grid",
            placeItems: "center",
          }}
        >
          🎥
        </button>
      </NotificationProvider>
    </ThemeProvider>
  );
}
