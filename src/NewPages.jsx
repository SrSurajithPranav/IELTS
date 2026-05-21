import React from "react";
import { API_BASE_URL } from "./services/api";

/**
 * NewPages.jsx
 * Drop this file in src/ and import the components into App.jsx
 *
 * Exports:
 *   AdminAddStudent   — teacher creates student with credentials
 *   LiveSessionsPage  — Jitsi-based voice/video rooms + recordings
 *   QuizzesPage       — interactive quizzes & games
 *   ResourcesPage     — study materials library
 *   AdminSessionsMgr  — teacher schedules sessions
 */

import { useState, useEffect } from "react";

/* ─── re-use the same design tokens from App.jsx ─── */
const card = {
  background: "var(--card, #13161f)",
  border: "1px solid var(--border, rgba(255,255,255,.07))",
  borderRadius: 12,
  padding: 20,
};
const inp = {
  width: "100%",
  background: "var(--bg3, #181c27)",
  border: "1px solid var(--border, rgba(255,255,255,.07))",
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--text, #dde1ed)",
  fontSize: 13,
  outline: "none",
};
const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{ ...card, ...style }}>
    {children}
  </div>
);
const Btn = ({ children, onClick, v = "primary", variant, disabled = false, full = false, style = {}, ...rest }) => {
  const tone = variant || v;
  const vs = {
    primary: { background: "var(--accent,#5b8def)", color: "#fff" },
    outline: { background: "transparent", color: "var(--accent,#5b8def)", border: "1px solid var(--accent,#5b8def)" },
    danger:  { background: "var(--danger,#f87171)", color: "#fff" },
    success: { background: "var(--success,#34d399)", color: "#0b0d12" },
    purple:  { background: "var(--accent2,#8b5cf6)", color: "#fff" },
    ghost:   { background: "transparent", color: "var(--muted2,#7b849c)" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...vs[tone], padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: "pointer", border: "none", opacity: disabled ? .5 : 1,
        width: full ? "100%" : "auto", ...vs[tone], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
      {...rest}
    >{children}</button>
  );
};
const Label = ({ children }) => (
  <label style={{ fontSize: 11, color: "var(--muted2,#7b849c)", display: "block", marginBottom: 5, fontWeight: 500 }}>
    {children}
  </label>
);
const Badge = ({ label, c = "accent" }) => {
  const m = {
    accent:  ["rgba(91,141,239,.15)", "#5b8def"],
    success: ["rgba(52,211,153,.15)", "#34d399"],
    warn:    ["rgba(251,191,36,.15)", "#fbbf24"],
    danger:  ["rgba(248,113,113,.15)", "#f87171"],
    purple:  ["rgba(139,92,246,.15)", "#a78bfa"],
    gold:    ["rgba(244,185,66,.15)", "#f4b942"],
  };
  const [bg, col] = m[c] || m.accent;
  return <span style={{ background: bg, color: col, fontSize: 10, fontWeight: 600,
    padding: "2px 9px", borderRadius: 99, letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</span>;
};

const API = API_BASE_URL;
const DEMO_STUDENT_EMAILS = new Set([
  "student1@gmail.com",
  "student2@gmail.com",
  "student3@gmail.com",
  "student4@gmail.com",
  "student5@gmail.com",
]);
const token = () => localStorage.getItem("jwt_token");
const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const apiFetch = async (path, opts = {}) => {
  try {
    const tk = token();
    const authHdr = tk ? { Authorization: `Bearer ${tk}` } : {};
    const response = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json", ...authHdr, ...opts.headers },
      ...opts,
    });
    const data = await parseResponse(response);
    if (!response.ok) {
      const message = data && typeof data === "object" && data.error ? data.error : `API error: ${response.status}`;
      return { error: message, status: response.status, data };
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      return { error: "Cannot reach backend API. Check backend/server availability and API URL settings." };
    }
    return { error: error.message || "Failed to fetch" };
  }
};

const openExternal = (url) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const isDemoStudent = (student) => DEMO_STUDENT_EMAILS.has(String(student?.email || "").toLowerCase());
const visibleStudents = (rows) => (Array.isArray(rows) ? rows.filter((student) => !isDemoStudent(student)) : []);

/* ═══════════════════════════════════════════════════════
   1.  ADMIN — ADD STUDENT
═══════════════════════════════════════════════════════ */
export const AdminAddStudent = ({ onCreated }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", plan_id: "", zoom_link: "" });
  const [plans, setPlans] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/plans/").then(d => setPlans(Array.isArray(d) ? d : []));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await apiFetch("/students/", {
        method: "POST",
        body: JSON.stringify({ ...form, plan_id: form.plan_id || undefined }),
      });
      if (res.error) { setError(res.error); }
      else { setResult(res); onCreated && onCreated(res.student); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  if (result) return (
    <div style={{ ...card, border: "1px solid var(--success,#34d399)" }}>
      <div style={{ color: "var(--success,#34d399)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>✓ Student Created!</div>
      <div style={{ background: "var(--bg3,#181c27)", borderRadius: 9, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 13, marginBottom: 6 }}><b>Name:</b> {result.student.name}</div>
        <div style={{ fontSize: 13, marginBottom: 6 }}><b>Email:</b> {result.login_credentials.email}</div>
        <div style={{ fontSize: 13, marginBottom: 6 }}><b>Password:</b> {result.login_credentials.password}</div>
        <div style={{ fontSize: 11, color: "var(--warn,#fbbf24)", marginTop: 8 }}>
          ⚠ Share these credentials with the student. Password won't be shown again.
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => { setResult(null); setForm({ name:"",email:"",password:"",plan_id:"",zoom_link:"" }); }}>
          Add Another
        </Btn>
        <Btn v="ghost" onClick={() => navigator.clipboard.writeText(
          `Email: ${result.login_credentials.email}\nPassword: ${result.login_credentials.password}`
        )}>Copy Credentials</Btn>
      </div>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>
        Add New Student
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <Label>Full Name *</Label>
          <input style={inp} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Rahul Sharma" />
        </div>
        <div>
          <Label>Email *</Label>
          <input style={inp} value={form.email} onChange={e => set("email", e.target.value)} placeholder="rahul@email.com" />
        </div>
        <div>
          <Label>Password *</Label>
          <input style={inp} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 characters" />
        </div>
        <div>
          <Label>Assign Plan (optional)</Label>
          <select style={inp} value={form.plan_id} onChange={e => set("plan_id", e.target.value)}>
            <option value="">— None —</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <Label>Zoom / Jitsi Link (optional)</Label>
          <input style={inp} value={form.zoom_link} onChange={e => set("zoom_link", e.target.value)} placeholder="https://meet.jit.si/your-room" />
        </div>
      </div>
      {error && <div style={{ color: "var(--danger,#f87171)", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <Btn onClick={submit} disabled={loading || !form.name || !form.email || !form.password}>
        {loading ? "Creating…" : "Create Student + Generate Credentials"}
      </Btn>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   2.  LIVE SESSIONS PAGE  (student view)
═══════════════════════════════════════════════════════ */
export const LiveSessionsPage = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    apiFetch("/sessions/").then(d => setSessions(Array.isArray(d) ? d : []));
    apiFetch("/sessions/recordings").then(d => setRecordings(Array.isArray(d) ? d : []));
  }, []);

  const upcoming = sessions.filter(s => s.status !== "ended");
  const ended = sessions.filter(s => s.status === "ended");

  return (
    <div>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700, marginBottom: 4 }}>Live Sessions</div>
      <p style={{ color: "var(--muted2,#7b849c)", fontSize: 12, marginBottom: 18 }}>
        Join voice/video rooms via Jitsi Meet — works in browser, no app needed
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["upcoming","Upcoming"],["recordings","Recordings"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: tab === id ? "var(--accent,#5b8def)" : "var(--bg3,#181c27)",
            color: tab === id ? "#fff" : "var(--muted2,#7b849c)",
            border: "1px solid var(--border,rgba(255,255,255,.07))", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {tab === "upcoming" && (
        <div>
          {upcoming.length === 0 && (
            <div style={{ ...card, textAlign: "center", padding: 40, color: "var(--muted2,#7b849c)" }}>
              No upcoming sessions scheduled. Check back soon!
            </div>
          )}
          {upcoming.map(s => (
            <div key={s.id} style={{ ...card, marginBottom: 12,
              borderLeft: `3px solid ${s.status === "live" ? "var(--success,#34d399)" : "var(--accent,#5b8def)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</div>
                  {s.topic && <div style={{ fontSize: 12, color: "var(--muted2,#7b849c)", marginTop: 2 }}>{s.topic}</div>}
                  <div style={{ fontSize: 11, color: "var(--muted,#5a6076)", marginTop: 4 }}>
                    {new Date(s.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    {" · "}{s.session_type === "group" ? "Group Session" : "1-on-1 Session"}
                  </div>
                </div>
                <Badge label={s.status === "live" ? "🔴 LIVE" : "Scheduled"} c={s.status === "live" ? "danger" : "accent"} />
              </div>

              {/* Jitsi embed on click-to-join */}
              <JitsiJoinButton url={s.jitsi_url} live={s.status === "live"} />
            </div>
          ))}

          {/* Quick solo room — always available */}
          <div style={{ ...card, marginTop: 8, border: "2px dashed var(--border,rgba(255,255,255,.07))" }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Practice Room</div>
            <p style={{ fontSize: 12, color: "var(--muted2,#7b849c)", marginBottom: 12 }}>
              Open a private room anytime for self-practice or scheduled 1-on-1 with your teacher.
            </p>
            <JitsiJoinButton url={`https://meet.jit.si/ielts-practice-${user?.id}`} live />
          </div>
        </div>
      )}

      {tab === "recordings" && (
        <div>
          {recordings.length === 0 && (
            <div style={{ ...card, textAlign: "center", padding: 40, color: "var(--muted2,#7b849c)" }}>
              No recordings available yet.
            </div>
          )}
          {recordings.map(r => (
            <div key={r.id} style={{ ...card, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted,#5a6076)", marginTop: 3 }}>
                    {r.duration_min > 0 ? `${r.duration_min} min` : ""} ·{" "}
                    {new Date(r.uploaded_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <Btn v="outline" onClick={() => openExternal(r.url)}>▷ Watch / Listen</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Jitsi join button — opens in new tab (no API key needed) */
const JitsiJoinButton = ({ url, live }) => (
  <button
    onClick={() => openExternal(url)}
    style={{
      background: live ? "#2D8CFF" : "var(--bg3,#181c27)",
      color: live ? "#fff" : "var(--accent,#5b8def)",
      border: live ? "none" : "1px solid var(--accent,#5b8def)",
      padding: "10px 20px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer",
    }}>
      {live ? "🎙 Join Now (Jitsi)" : "🔗 Join When Live"}
  </button>
);

/* ═══════════════════════════════════════════════════════
   3.  QUIZZES / GAMES PAGE
═══════════════════════════════════════════════════════ */
const CATEGORIES = ["reading", "listening", "writing", "learning", "grammar", "vocab", "speaking", "mock_ielts"];
const CAT_ICONS = { grammar:"📝",vocab:"📖",listening:"🎧",reading:"📄",speaking:"🎙",mock_ielts:"🏆" };

export const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [active, setActive] = useState(null);   // { quiz, questions }
  const [catFilter, setCatFilter] = useState("all");

  const loadQuizzes = async () => {
    const url = catFilter === "all" ? "/quizzes/" : `/quizzes/?category=${catFilter}`;
    const d = await apiFetch(url);
    setQuizzes(Array.isArray(d) ? d : []);
  };

  useEffect(() => { loadQuizzes(); }, [catFilter]);

  if (active) return <QuizRunner quiz={active} onDone={() => { setActive(null); loadQuizzes(); }} />;

  return (
    <div>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
        Quizzes & Practice Games
      </div>
      <p style={{ color: "var(--muted2,#7b849c)", fontSize: 12, marginBottom: 18 }}>
        Test your skills with interactive quizzes. Track your scores over time.
      </p>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {["all", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: catFilter === c ? "var(--accent,#5b8def)" : "var(--bg3,#181c27)",
            color: catFilter === c ? "#fff" : "var(--muted2,#7b849c)",
            border: "1px solid var(--border,rgba(255,255,255,.07))", cursor: "pointer",
          }}>{CAT_ICONS[c] || "◉"} {c === "all" ? "All" : c.replace("_", " ")}</button>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 40, color: "var(--muted2,#7b849c)" }}>
          No quizzes yet — ask your teacher to add some!
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
        {quizzes.map(q => (
          <div key={q.id} style={{ ...card, cursor: "pointer" }}
            onClick={async () => {
              const full = await apiFetch(`/quizzes/${q.id}`);
              setActive(full);
            }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{CAT_ICONS[q.category] || "📋"}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.title}</div>
            <div style={{ fontSize: 11, color: "var(--muted,#5a6076)", marginBottom: 10 }}>
              {q.question_count} questions · {q.time_limit_min} min · {q.difficulty}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Badge label={q.category} c="accent" />
              <Btn v="outline">Start →</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Utility: Small three-dot menu for inline actions (used by several admin pages) ─── */
export const ThreeDotMenu = ({ items = [] }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}>⋮</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, zIndex: 999, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 6 }}>
          {items.map((it, i) => (
            it === 'divider' ? <div key={i} style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} /> :
            <button key={i} onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick(); }} style={{ display: 'block', padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Writing timed session component (lightweight) ─── */
export const WritingTimedSession = ({ onComplete }) => {
  const [text, setText] = React.useState('');
  const [minutes, setMinutes] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const run = async () => {
    setLoading(true);
    const res = await apiFetch('/ai/writing/timed-session', { method: 'POST', body: JSON.stringify({ text, minutes }) });
    setLoading(false);
    if (res && !res.error) { setResult(res); onComplete && onComplete(res); }
  };

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Timed Writing Practice</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="number" value={minutes} onChange={e => setMinutes(parseInt(e.target.value || 0))} style={{ width: 120, padding: '8px 10px', borderRadius: 8 }} />
        <button onClick={run} style={{ padding: '8px 12px', borderRadius: 8 }}>{loading ? 'Analyzing…' : 'Submit for Analysis'}</button>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste your timed essay here" style={{ width: '100%', minHeight: 180, padding: 12, borderRadius: 10, background: 'var(--bg3)' }} />
      {result && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>Band Estimate: {result.band_estimate}</div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>{result.pace_note}</div>
          <ul style={{ marginTop: 8 }}>{(result.suggestions || []).map((s,i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
};

/* ─── Vocabulary flashcard deck (very lightweight) ─── */
export const VocabFlashcardDeck = ({ userId }) => {
  const [cards, setCards] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch('/vocabulary/').then(d => { setCards(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const mark = async (correct) => {
    const card = cards[idx];
    if (!card) return;
    await apiFetch(`/vocabulary/${card.id}/review`, { method: 'POST', body: JSON.stringify({ correct }) });
    setIdx(i => (i + 1) % Math.max(1, cards.length));
  };

  if (loading) return <div style={card}>Loading cards…</div>;
  if (!cards.length) return <div style={card}>No cards yet.</div>;
  const card = cards[idx];
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{card.word}</div>
      <div style={{ color: 'var(--muted)', marginTop: 8 }}>{card.definition}</div>
      {card.example && <div style={{ marginTop: 8, fontStyle: 'italic' }}>“{card.example}”</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => mark(true)} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--success)' }}>I knew this</button>
        <button onClick={() => mark(false)} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)' }}>Review again</button>
      </div>
    </div>
  );
};

/* Inline quiz runner */
const QuizRunner = ({ quiz, onDone }) => {
  const questions = quiz.questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [aiCoach, setAiCoach] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (!finished || !result || aiCoach || aiLoading) return;
    const weakPoints = Array.isArray(result.results)
      ? result.results
          .filter((item) => item.your_answer !== item.correct_answer)
          .slice(0, 3)
          .map((item) => item.question)
      : [];

    setAiLoading(true);
    setAiError("");
    apiFetch("/ai/quiz/analyze", {
      method: "POST",
      body: JSON.stringify({
        quiz_title: quiz.title,
        category: quiz.category,
        score: result.score,
        correct: result.correct,
        total: result.total,
        weak_points: weakPoints,
      }),
    })
      .then((res) => {
        if (res?.error) {
          setAiError(res.error);
          setAiCoach(null);
        } else {
          setAiCoach(res);
        }
      })
      .catch((error) => setAiError(error.message || "AI coach failed."))
      .finally(() => setAiLoading(false));
  }, [finished, result, aiCoach, aiLoading, quiz.title, quiz.category]);

  if (questions.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40 }}>
      <p style={{ color: "var(--muted2,#7b849c)" }}>This quiz has no questions yet.</p>
      <Btn onClick={onDone} style={{ marginTop: 14 }}>Back</Btn>
    </div>
  );

  const current = questions[idx];
  const totalQ = questions.length;

  const pick = (i) => { if (!revealed) { setSelected(i); setRevealed(true); } };

  const next = async () => {
    const newAnswers = [...answers, selected ?? -1];
    if (idx + 1 < totalQ) {
      setAnswers(newAnswers); setIdx(idx + 1); setSelected(null); setRevealed(false);
    } else {
      // submit
      const res = await apiFetch(`/quizzes/${quiz.id}/attempt`, {
        method: "POST", body: JSON.stringify({ answers: newAnswers }),
      });
      setResult(res); setFinished(true);
    }
  };

  if (finished && result) return (
    <div style={card}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{result.score >= 70 ? "🎉" : "📚"}</div>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700, color: "var(--accent,#5b8def)" }}>
          {result.score}%
        </div>
        <div style={{ fontSize: 13, color: "var(--muted2,#7b849c)", marginTop: 4 }}>
          {result.correct} / {result.total} correct
        </div>
      </div>
      {result.results.map((r, i) => (
        <div key={i} style={{ ...card, marginBottom: 8, background: "var(--bg3,#181c27)",
          borderLeft: `3px solid ${r.your_answer === r.correct_answer ? "var(--success,#34d399)" : "var(--danger,#f87171)"}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{r.question}</div>
          <div style={{ fontSize: 12, color: r.your_answer === r.correct_answer ? "var(--success,#34d399)" : "var(--danger,#f87171)" }}>
            Your answer: {r.options[r.your_answer] ?? "—"}
          </div>
          {r.your_answer !== r.correct_answer && (
            <div style={{ fontSize: 12, color: "var(--success,#34d399)" }}>
              Correct: {r.options[r.correct_answer]}
            </div>
          )}
          {r.explanation && (
            <div style={{ fontSize: 11, color: "var(--muted2,#7b849c)", marginTop: 4 }}>💡 {r.explanation}</div>
          )}
        </div>
      ))}
      <div style={{ ...card, marginTop: 12, background: "rgba(91,141,239,.08)", border: "1px solid rgba(91,141,239,.24)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>AI Quiz Coach</div>
          {aiCoach && <Badge label={`Band ${aiCoach.band_estimate}`} c="success" />}
        </div>
        {aiLoading && <div style={{ fontSize: 12, color: "var(--muted2,#7b849c)" }}>Building your improvement plan…</div>}
        {aiError && <div style={{ fontSize: 12, color: "var(--danger,#f87171)" }}>{aiError}</div>}
        {aiCoach && (
          <div>
            <div style={{ fontSize: 12, color: "var(--muted2,#7b849c)", marginBottom: 8 }}>
              Accuracy {aiCoach.analysis.accuracy}% · {aiCoach.analysis.correct}/{aiCoach.analysis.total} correct
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Strengths</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text)" }}>
              {aiCoach.analysis.strengths.map((item, index) => <li key={index} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 12, marginBottom: 8 }}>Next steps</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text)" }}>
              {aiCoach.analysis.suggestions.map((item, index) => <li key={index} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
      <Btn onClick={onDone} style={{ marginTop: 10 }}>Back to Quizzes</Btn>
    </div>
  );

  const pct = Math.round(((idx) / totalQ) * 100);

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--muted2,#7b849c)" }}>Question {idx + 1} of {totalQ}</span>
        <button onClick={onDone} style={{ background: "none", color: "var(--muted,#5a6076)", fontSize: 13, cursor: "pointer", border: "none" }}>✕ Quit</button>
      </div>
      {/* Progress */}
      <div style={{ background: "var(--border2,rgba(255,255,255,.12))", borderRadius: 99, height: 4, marginBottom: 20 }}>
        <div style={{ width: `${pct}%`, background: "var(--accent,#5b8def)", height: "100%", borderRadius: 99, transition: "width .4s" }} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, lineHeight: 1.5 }}>{current.question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {current.options.map((opt, i) => {
          const isCorrect = revealed && i === current.correct_index;
          const isWrong   = revealed && selected === i && i !== current.correct_index;
          return (
            <button key={i} onClick={() => pick(i)} style={{
              padding: "11px 16px", borderRadius: 9, textAlign: "left", fontSize: 13,
              background: isCorrect ? "rgba(52,211,153,.15)" : isWrong ? "rgba(248,113,113,.15)"
                : selected === i ? "rgba(91,141,239,.12)" : "var(--bg3,#181c27)",
              border: `1px solid ${isCorrect ? "var(--success,#34d399)" : isWrong ? "var(--danger,#f87171)"
                : selected === i ? "var(--accent,#5b8def)" : "var(--border,rgba(255,255,255,.07))"}`,
              color: "var(--text,#dde1ed)", cursor: revealed ? "default" : "pointer",
              fontFamily: "inherit",
            }}>
              {isCorrect ? "✓ " : isWrong ? "✗ " : ""}{opt}
            </button>
          );
        })}
      </div>
      {revealed && current.explanation && (
        <div style={{ fontSize: 12, color: "var(--muted2,#7b849c)", marginBottom: 14,
          padding: "10px 14px", background: "var(--bg3,#181c27)", borderRadius: 8 }}>
          💡 {current.explanation}
        </div>
      )}
      {revealed && <Btn onClick={next}>{idx + 1 < totalQ ? "Next →" : "See Results"}</Btn>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   4.  RESOURCES PAGE
═══════════════════════════════════════════════════════ */
const TYPE_ICONS = { link: "🔗", pdf: "📄", video: "▷", audio: "🎧" };

export const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [catFilter, setCatFilter] = useState("all");
  const RES_CATS = ["all", "speaking", "writing", "listening", "reading", "grammar", "vocab", "general"];

  useEffect(() => {
    const url = catFilter === "all" ? "/resources/" : `/resources/?category=${catFilter}`;
    apiFetch(url).then(d => setResources(Array.isArray(d) ? d : []));
  }, [catFilter]);

  return (
    <div>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700, marginBottom: 4 }}>Resources</div>
      <p style={{ color: "var(--muted2,#7b849c)", fontSize: 12, marginBottom: 18 }}>Study materials from your teacher</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {RES_CATS.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: catFilter === c ? "var(--accent,#5b8def)" : "var(--bg3,#181c27)",
            color: catFilter === c ? "#fff" : "var(--muted2,#7b849c)",
            border: "1px solid var(--border,rgba(255,255,255,.07))", cursor: "pointer",
          }}>{c}</button>
        ))}
      </div>
      {resources.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 40, color: "var(--muted2,#7b849c)" }}>
          No resources added yet.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {resources.map(r => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{TYPE_ICONS[r.type] || "🔗"}</span>
              <Badge label={r.category} c="accent" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text,#dde1ed)", marginBottom: 4 }}>{r.title}</div>
            {r.description && (
              <div style={{ fontSize: 12, color: "var(--muted2,#7b849c)", lineHeight: 1.5 }}>{r.description}</div>
            )}
            <div style={{ fontSize: 11, color: "var(--accent,#5b8def)", marginTop: 8 }}>Open {r.type} →</div>
          </a>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   5.  ADMIN — SESSIONS MANAGER
═══════════════════════════════════════════════════════ */
export const AdminSessionsMgr = () => {
  const [sessions, setSessions] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ title: "", topic: "", session_type: "group", batch_id: "", scheduled_at: "", student_id: "" });
  const [recForm, setRecForm] = useState({ session_id: null, title: "", url: "", duration_min: "" });

  useEffect(() => {
    apiFetch("/sessions/").then(d => setSessions(Array.isArray(d) ? d : []));
    apiFetch("/batches/").then(d => setBatches(Array.isArray(d) ? d : []));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setR = (k, v) => setRecForm(f => ({ ...f, [k]: v }));

  const createSession = async () => {
    const res = await apiFetch("/sessions/", { method: "POST", body: JSON.stringify(form) });
    if (!res.error) { setSessions(ss => [res, ...ss]); setShowNew(false); }
  };

  const addRecording = async () => {
    const res = await apiFetch(`/sessions/${recForm.session_id}/recording`, {
      method: "POST", body: JSON.stringify(recForm),
    });
    if (!res.error) {
      setSessions(ss => ss.map(s => s.id === recForm.session_id
        ? { ...s, recordings: [...(s.recordings || []), res] } : s));
      setRecForm({ session_id: null, title: "", url: "", duration_min: "" });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700 }}>Live Sessions</div>
        <Btn onClick={() => setShowNew(n => !n)}>+ Schedule Session</Btn>
      </div>

      {showNew && (
        <div style={{ ...card, marginBottom: 18, border: "1px solid var(--accent,#5b8def)" }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>New Session</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><Label>Title *</Label><input style={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Writing Workshop" /></div>
            <div><Label>Topic</Label><input style={inp} value={form.topic} onChange={e => set("topic", e.target.value)} placeholder="Task 2 Opinion Essays" /></div>
            <div>
              <Label>Type</Label>
              <select style={inp} value={form.session_type} onChange={e => set("session_type", e.target.value)}>
                <option value="group">Group (Batch)</option>
                <option value="solo">Solo (1-on-1)</option>
              </select>
            </div>
            {form.session_type === "group" ? (
              <div>
                <Label>Batch</Label>
                <select style={inp} value={form.batch_id} onChange={e => set("batch_id", e.target.value)}>
                  <option value="">— Select batch —</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            ) : (
              <div><Label>Student ID</Label><input style={inp} type="number" value={form.student_id} onChange={e => set("student_id", e.target.value)} placeholder="Student ID" /></div>
            )}
            <div style={{ gridColumn: "span 2" }}>
              <Label>Scheduled At</Label>
              <input style={inp} type="datetime-local" value={form.scheduled_at} onChange={e => set("scheduled_at", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn onClick={createSession} disabled={!form.title}>Create Session</Btn>
            <Btn v="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {sessions.map(s => (
        <div key={s.id} style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              {s.topic && <div style={{ fontSize: 12, color: "var(--muted2,#7b849c)" }}>{s.topic}</div>}
              <div style={{ fontSize: 11, color: "var(--muted,#5a6076)", marginTop: 3 }}>
                {new Date(s.scheduled_at).toLocaleString("en-IN")} · {s.session_type}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge label={s.status} c={s.status === "live" ? "danger" : "accent"} />
              <Btn v="outline" onClick={() => openExternal(s.jitsi_url)}>Open Room</Btn>
            </div>
          </div>
          {/* Add recording button */}
          {recForm.session_id === s.id ? (
            <div style={{ marginTop: 10, padding: 12, background: "var(--bg3,#181c27)", borderRadius: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><Label>Recording Title</Label><input style={inp} value={recForm.title} onChange={e => setR("title", e.target.value)} /></div>
                <div><Label>Duration (min)</Label><input style={inp} type="number" value={recForm.duration_min} onChange={e => setR("duration_min", e.target.value)} /></div>
                <div style={{ gridColumn: "span 2" }}><Label>URL (Cloudinary / YouTube / Drive)</Label><input style={inp} value={recForm.url} onChange={e => setR("url", e.target.value)} placeholder="https://…" /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={addRecording} disabled={!recForm.url || !recForm.title}>Save Recording</Btn>
                <Btn v="ghost" onClick={() => setRecForm({ session_id: null, title: "", url: "", duration_min: "" })}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <Btn v="ghost" onClick={() => setRecForm(f => ({ ...f, session_id: s.id }))}>+ Add Recording</Btn>
          )}
          {s.recordings?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {s.recordings.map(r => (
                <div key={r.id} style={{ fontSize: 12, color: "var(--accent,#5b8def)", marginTop: 4 }}>
                  ▷ <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>{r.title}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   6.  ADMIN — RESOURCES MANAGER
═══════════════════════════════════════════════════════ */
export const AdminResourcesMgr = () => {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ title: "", category: "general", type: "link", url: "", description: "" });
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    apiFetch("/resources/").then(d => setResources(Array.isArray(d) ? d : []));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const create = async () => {
    const res = await apiFetch("/resources/", { method: "POST", body: JSON.stringify(form) });
    if (!res.error) { setResources(rs => [res, ...rs]); setShowNew(false); setForm({ title:"",category:"general",type:"link",url:"",description:"" }); }
  };

  const del = async (id) => {
    await apiFetch(`/resources/${id}`, { method: "DELETE" });
    setResources(rs => rs.filter(r => r.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700 }}>Resources</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn onClick={() => setShowNew(n => !n)}>+ Add Resource</Btn>
        </div>
      </div>
      <Card style={{ marginBottom: 14, border: "1px solid rgba(20,108,114,.22)", background: "rgba(20,108,114,.05)", fontSize: 12 }}>
        Resource library is private to your platform users. Add your own student-safe links here.
      </Card>
      {showNew && (
        <div style={{ ...card, marginBottom: 18, border: "1px solid var(--accent,#5b8def)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}><Label>Title *</Label><input style={inp} value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>
                {["speaking","writing","listening","reading","grammar","vocab","general"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select style={inp} value={form.type} onChange={e => set("type", e.target.value)}>
                {["link","pdf","video","audio"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}><Label>URL *</Label><input style={inp} value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://…" /></div>
            <div style={{ gridColumn: "span 2" }}><Label>Description</Label><input style={inp} value={form.description} onChange={e => set("description", e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={create} disabled={!form.title || !form.url}>Add Resource</Btn>
            <Btn v="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
          </div>
        </div>
      )}
      {resources.map(r => (
        <div key={r.id} style={{ ...card, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{TYPE_ICONS[r.type]} {r.title}</div>
            <div style={{ fontSize: 11, color: "var(--muted,#5a6076)", marginTop: 3 }}>{r.category} · {r.type}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn v="outline" onClick={() => openExternal(r.url)}>Open</Btn>
            <Btn v="danger" onClick={() => del(r.id)}>Delete</Btn>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   7.  ADMIN — QUIZ BUILDER
═══════════════════════════════════════════════════════ */
export const AdminQuizBuilder = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [meta, setMeta] = useState({ title: "", category: "grammar", difficulty: "intermediate", time_limit_min: 10 });
  const [autoCount, setAutoCount] = useState(8);
  const [autoMsg, setAutoMsg] = useState("");
  const [autoLoading, setAutoLoading] = useState(false);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }
  ]);

  useEffect(() => {
    apiFetch("/quizzes/").then(d => setQuizzes(Array.isArray(d) ? d : []));
  }, []);

  const refreshQuizzes = async () => {
    const d = await apiFetch("/quizzes/");
    setQuizzes(Array.isArray(d) ? d : []);
  };

  const setM = (k, v) => setMeta(m => ({ ...m, [k]: v }));
  const setQ = (qi, k, v) => setQuestions(qs => qs.map((q, i) => i === qi ? { ...q, [k]: v } : q));
  const setOpt = (qi, oi, v) => setQuestions(qs => qs.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? v : o) } : q));

  const addQ = () => setQuestions(qs => [...qs, { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]);
  const removeQ = (qi) => setQuestions(qs => qs.filter((_, i) => i !== qi));

  const save = async () => {
    const res = await apiFetch("/quizzes/", {
      method: "POST",
      body: JSON.stringify({ ...meta, questions: questions.map(q => ({ ...q, correct: parseInt(q.correct) })) }),
    });
    if (!res.error) { setQuizzes(qs => [res, ...qs]); setShowNew(false); }
  };

  const autoGenerate = async () => {
    setAutoMsg("");
    setAutoLoading(true);
    const payload = {
      title: `${meta.category.charAt(0).toUpperCase()}${meta.category.slice(1)} Random Practice`,
      category: meta.category,
      difficulty: meta.difficulty,
      time_limit_min: parseInt(meta.time_limit_min, 10) || 12,
      question_count: parseInt(autoCount, 10) || 8,
    };
    const res = await apiFetch("/quizzes/generate-random", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res?.error) {
      setAutoMsg(res.error);
    } else {
      setQuizzes(qs => [res, ...qs]);
      setAutoMsg(`Generated quiz: ${res.title}`);
    }
    setAutoLoading(false);
  };

  const openPreview = async (quizId) => {
    const full = await apiFetch(`/quizzes/${quizId}`);
    if (!full?.error) {
      setPreviewQuiz(full);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 21, fontWeight: 700 }}>Quiz Builder</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            min={4}
            max={20}
            value={autoCount}
            onChange={e => setAutoCount(e.target.value)}
            style={{ ...inp, width: 90 }}
            title="Question count"
          />
          <Btn onClick={autoGenerate} disabled={autoLoading}>{autoLoading ? "Generating..." : "Generate Random Quiz"}</Btn>
          <Btn v="outline" onClick={() => setShowNew(n => !n)}>+ New Quiz</Btn>
        </div>
      </div>
      {autoMsg && (
        <Card style={{ marginBottom: 14, border: "1px solid rgba(20,108,114,.25)", background: "rgba(20,108,114,.06)", fontSize: 12 }}>
          {autoMsg}
        </Card>
      )}

      {showNew && (
        <div style={{ ...card, marginBottom: 18, border: "1px solid var(--accent,#5b8def)" }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>New Quiz</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ gridColumn: "span 2" }}><Label>Quiz Title *</Label><input style={inp} value={meta.title} onChange={e => setM("title", e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <select style={inp} value={meta.category} onChange={e => setM("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <select style={inp} value={meta.difficulty} onChange={e => setM("difficulty", e.target.value)}>
                <option>beginner</option><option>intermediate</option><option>advanced</option>
              </select>
            </div>
            <div><Label>Time Limit (min)</Label><input style={inp} type="number" value={meta.time_limit_min} onChange={e => setM("time_limit_min", e.target.value)} /></div>
          </div>

          <div style={{ fontWeight: 600, marginBottom: 10 }}>Questions</div>
          {questions.map((q, qi) => (
            <div key={qi} style={{ padding: 14, background: "var(--bg3,#181c27)", borderRadius: 9, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent,#5b8def)" }}>Q{qi + 1}</span>
                {questions.length > 1 && <button onClick={() => removeQ(qi)} style={{ background: "none", color: "var(--danger,#f87171)", fontSize: 12, cursor: "pointer", border: "none" }}>Remove</button>}
              </div>
              <input style={{ ...inp, marginBottom: 8 }} value={q.question} onChange={e => setQ(qi, "question", e.target.value)} placeholder="Question text" />
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <input type="radio" name={`correct-${qi}`} checked={q.correct === oi} onChange={() => setQ(qi, "correct", oi)} />
                  <input style={{ ...inp }} value={opt} onChange={e => setOpt(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                </div>
              ))}
              <input style={{ ...inp, marginTop: 4 }} value={q.explanation} onChange={e => setQ(qi, "explanation", e.target.value)} placeholder="Explanation (optional)" />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn v="outline" onClick={addQ}>+ Add Question</Btn>
            <Btn onClick={save} disabled={!meta.title || questions.some(q => !q.question)}>Save Quiz</Btn>
            <Btn v="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {previewQuiz && (
        <div style={{ ...card, marginBottom: 12, border: "1px solid rgba(91,141,239,.35)", background: "rgba(91,141,239,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>{previewQuiz.title}</div>
            <Btn v="ghost" onClick={() => setPreviewQuiz(null)}>Close</Btn>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted,#5a6076)", marginBottom: 10 }}>
            {previewQuiz.category} · {previewQuiz.question_count} questions · {previewQuiz.difficulty}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {(previewQuiz.questions || []).slice(0, 5).map((item, index) => (
              <div key={item.id || index} style={{ padding: 10, borderRadius: 8, background: "var(--bg3,#181c27)", border: "1px solid var(--border,rgba(255,255,255,.08))" }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Q{index + 1}. {item.question}</div>
                <div style={{ fontSize: 11, color: "var(--muted,#5a6076)" }}>
                  Correct: {item.options?.[item.correct_index] || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quizzes.map(q => (
        <div key={q.id} style={{ ...card, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{q.title}</div>
            <div style={{ fontSize: 11, color: "var(--muted,#5a6076)", marginTop: 3 }}>
              {q.category} · {q.question_count} questions · {q.difficulty}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge label={q.category} c="accent" />
            <Btn v="outline" onClick={() => openPreview(q.id)}>Preview</Btn>
          </div>
        </div>
      ))}
    </div>
  );
};