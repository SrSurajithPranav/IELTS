import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import DotMenu from '../../components/ui/DotMenu';
import { aiAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import {
  CATEGORIES,
  getQuestions,
  getMixedQuiz,
  getAdaptiveQuestions,
  SPEAKING_CUE_CARDS,
  WRITING_PROMPTS,
  TOTAL_QUESTIONS,
} from '../../data/questionBank';

const S = {
  page: { maxWidth: 860, margin: '0 auto' },
  title: { fontFamily: 'Fraunces,serif', fontSize: 24, fontWeight: 700, marginBottom: 6 },
  sub: { color: 'var(--muted)', fontSize: 13, marginBottom: 24 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 },
  catCard: (active, color) => ({
    padding: '14px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 200ms',
    border: `2px solid ${active ? color : 'var(--border)'}`,
    background: active ? `${color}14` : 'var(--card)', position: 'relative',
  }),
  pill: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99,
    fontSize: 11, fontWeight: 600, background: `${color}18`, color,
  }),
  optBtn: (state) => ({
    width: '100%', textAlign: 'left', padding: '13px 16px', borderRadius: 10,
    border: `2px solid ${state === 'correct' ? 'var(--success)' : state === 'wrong' ? 'var(--danger)' : state === 'missed' ? 'var(--warn)' : 'var(--border)'}`,
    background: state === 'correct' ? 'var(--success-soft)' : state === 'wrong' ? 'var(--danger-soft)' : state === 'missed' ? 'var(--warn-soft)' : 'var(--bg3)',
    color: 'var(--text)', fontSize: 14, cursor: state ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 150ms', lineHeight: 1.4,
  }),
  statBox: (color) => ({
    flex: 1, textAlign: 'center', padding: '16px 10px', background: 'var(--bg3)', borderRadius: 12, border: `1px solid ${color}30`,
  }),
};

function ProgBar({ pct, color = 'var(--accent)', height = 6 }) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 99, transition: 'width .5s ease' }} />
    </div>
  );
}

function useTimer(initialSec, onExpire) {
  const [sec, setSec] = useState(initialSec);
  const ref = useRef(null);
  const start = useCallback(() => {
    ref.current = setInterval(() => setSec((s) => {
      if (s <= 1) {
        clearInterval(ref.current);
        onExpire?.();
        return 0;
      }
      return s - 1;
    }), 1000);
  }, [onExpire]);
  const stop = useCallback(() => clearInterval(ref.current), []);
  const reset = useCallback((newSec) => {
    clearInterval(ref.current);
    setSec(newSec ?? initialSec);
  }, [initialSec]);
  useEffect(() => () => clearInterval(ref.current), []);
  const fmt = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const pct = initialSec ? (sec / initialSec) * 100 : 0;
  return { sec, fmt, pct, start, stop, reset };
}

function QuizEngine({ questions, quizTitle, category, onDone, onBack }) {
  const { error: notifyError } = useNotification();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [startTime] = useState(Date.now());

  const timeLimitSec = 30;
  const onExpire = useCallback(() => {
    if (!answered) {
      setSelected(-1);
      setAnswers((a) => [...a, -1]);
      setAnswered(true);
    }
  }, [answered]);
  const timer = useTimer(timeLimitSec, onExpire);

  useEffect(() => {
    timer.reset(timeLimitSec);
    timer.start();
  }, [idx]);

  const current = questions[idx];
  const score = answers.filter((a, i) => a === questions[i]?.c).length;

  const pick = (optIdx) => {
    if (answered) return;
    timer.stop();
    setSelected(optIdx);
    setAnswered(true);
    setAnswers((a) => [...a, optIdx]);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
      onDone?.({ score, total: questions.length, answers, questions, timeTaken: Math.floor((Date.now() - startTime) / 1000) });
      return;
    }
    setIdx((i) => i + 1);
    setAnswered(false);
    setSelected(null);
    setShowExp(false);
  };

  const getAiFeedback = async () => {
    setAnalyzing(true);
    try {
      const weakPoints = questions.filter((q, i) => answers[i] !== q.c).map((q) => q.tag || q.id).slice(0, 3);
      const res = await aiAPI.analyzeQuiz({
        score: (score / questions.length) * 100,
        total: questions.length,
        correct: score,
        quiz_title: quizTitle,
        category,
        weak_points: weakPoints,
      });
      setAiAnalysis(res);
    } catch (e) {
      notifyError(e.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="fade-up">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>Back to Games</button>
        <Card style={{ textAlign: 'center', padding: '36px 32px', marginBottom: 16 }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>{pct >= 90 ? 'Trophy' : pct >= 70 ? 'Target' : 'Book'}</div>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{score}/{questions.length} Correct</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--danger)', marginBottom: 8 }}>{pct}%</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={onBack}>Try Another Quiz</Button>
            <Button variant="outline" onClick={getAiFeedback} loading={analyzing}>AI Coach Feedback</Button>
          </div>
          {aiAnalysis && (
            <div style={{ marginTop: 24, textAlign: 'left', padding: 20, background: 'var(--bg3)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontFamily: 'Fraunces,serif' }}>AI Coach</div>
              {aiAnalysis.analysis?.strengths?.map((s, i) => (<div key={i} style={{ fontSize: 13, color: 'var(--success)', marginBottom: 6 }}>+ {s}</div>))}
              {aiAnalysis.analysis?.suggestions?.map((s, i) => (<div key={i} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>- {s}</div>))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  const timerColor = timer.pct > 60 ? 'var(--success)' : timer.pct > 30 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Exit Quiz</button>
        <div style={{ fontFamily: 'Fraunces,serif', fontSize: 16, fontWeight: 600 }}>{quizTitle}</div>
        <DotMenu items={[{ icon: 'Exit', label: 'Exit Quiz', action: onBack, danger: true }]} size="sm" />
      </div>

      <Card style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>Question {idx + 1} / {questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: timerColor, fontWeight: 700 }}>{timer.fmt}</span>
            <Badge label={`Score ${score}`} color="success" />
          </div>
        </div>
        <ProgBar pct={(idx / questions.length) * 100} />
        <div style={{ height: 4, marginTop: 6 }}><ProgBar pct={timer.pct} color={timerColor} height={4} /></div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {current.tag && <span style={S.pill('var(--accent)')}>{current.tag}</span>}
            {current.diff && <span style={S.pill(current.diff === 'advanced' ? 'var(--danger)' : current.diff === 'intermediate' ? 'var(--warn)' : 'var(--success)')}>{current.diff}</span>}
          </div>
          <DotMenu items={[
            { icon: 'Hint', label: 'Show Hint', action: () => setShowExp(true) },
            { icon: 'Skip', label: 'Skip Question', action: next },
          ]} size="sm" />
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>{current.q}</div>
        {showExp && !answered && (
          <div style={{ padding: '10px 14px', background: 'var(--warn-soft)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--warn)' }}>
            Hint: {current.exp}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {current.opts.map((opt, i) => {
            const state = answered
              ? i === current.c ? 'correct'
                : selected === i ? 'wrong'
                  : selected === -1 && i === current.c ? 'missed'
                    : null
              : null;
            return (
              <button key={i} onClick={() => pick(i)} style={S.optBtn(state)}>
                <span style={{ marginRight: 8, fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div>
            <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10, marginBottom: 14, fontSize: 13, lineHeight: 1.6 }}>
              {selected === current.c ? 'Correct. ' : selected === -1 ? 'Time up. ' : 'Incorrect. '}
              {current.exp}
            </div>
            <Button onClick={next} size="sm">{idx + 1 >= questions.length ? 'See Results' : 'Next Question'}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function SpeakingPractice({ onBack }) {
  const [cueIdx, setCueIdx] = useState(Math.floor(Math.random() * SPEAKING_CUE_CARDS.length));
  const [phase, setPhase] = useState('prep');
  const [notes, setNotes] = useState('');
  const [response, setResponse] = useState('');
  const cue = SPEAKING_CUE_CARDS[cueIdx];

  const prepTimer = useTimer(60, () => setPhase('speak'));
  const speakTimer = useTimer(120, () => setPhase('done'));

  useEffect(() => {
    if (phase === 'prep') prepTimer.start();
    if (phase === 'speak') speakTimer.start();
  }, [phase]);

  const next = () => {
    setCueIdx((i) => (i + 1) % SPEAKING_CUE_CARDS.length);
    setPhase('prep');
    setNotes('');
    setResponse('');
    prepTimer.reset(60);
    speakTimer.reset(120);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Back</button>
        <DotMenu items={[
          { icon: 'New', label: 'New Cue Card', action: next },
          { icon: 'Exit', label: 'Exit', action: onBack, danger: true },
        ]} size="sm" />
      </div>
      <div style={S.title}>Speaking Practice</div>
      <div style={S.sub}>Part 2 Cue Card | {cue.topic}</div>

      <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{cue.prompt}</div>
        {cue.points.map((p, i) => (
          <div key={i} style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span> {p}</div>
        ))}
      </Card>

      {phase === 'prep' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Preparation Time</span>
            <span style={{ color: prepTimer.sec < 15 ? 'var(--danger)' : 'var(--accent)', fontWeight: 700, fontSize: 18 }}>{prepTimer.fmt}</span>
          </div>
          <ProgBar pct={prepTimer.pct} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Jot quick notes"
            style={{ width: '100%', marginTop: 14, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ marginTop: 12 }}><Button size="sm" onClick={() => { prepTimer.stop(); setPhase('speak'); }}>Start Speaking</Button></div>
        </Card>
      )}

      {phase === 'speak' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Speaking Time</span>
            <span style={{ color: speakTimer.sec < 30 ? 'var(--danger)' : 'var(--success)', fontWeight: 700, fontSize: 18 }}>{speakTimer.fmt}</span>
          </div>
          <ProgBar pct={speakTimer.pct} color="var(--success)" />
          {notes && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, fontSize: 12, color: 'var(--muted)' }}><strong>Notes:</strong> {notes}</div>}
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3}
            placeholder="Optional reflection notes"
            style={{ width: '100%', marginTop: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ marginTop: 12 }}><Button size="sm" onClick={() => { speakTimer.stop(); setPhase('done'); }}>Finish</Button></div>
        </Card>
      )}

      {phase === 'done' && (
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Well done</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button onClick={next}>Next Cue Card</Button>
            <Button variant="outline" onClick={onBack}>Back to Games</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function WritingPractice({ onBack }) {
  const [promptIdx, setPromptIdx] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState('all');

  const prompts = filter === 'all' ? WRITING_PROMPTS : WRITING_PROMPTS.filter((p) => p.type.toLowerCase().includes(filter));
  const current = prompts[promptIdx % Math.max(prompts.length, 1)] || WRITING_PROMPTS[0];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const target = current?.wordTarget || 250;
  const timeMin = current?.timeMin || 40;
  const timer = useTimer(timeMin * 60, () => {});

  useEffect(() => {
    timer.reset(timeMin * 60);
    timer.start();
  }, [promptIdx, filter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Back</button>
        <DotMenu items={[
          { icon: 'New', label: 'New Prompt', action: () => { setPromptIdx((i) => (i + 1) % prompts.length); setText(''); setSubmitted(false); } },
          { icon: 'Clear', label: 'Clear Text', action: () => setText(''), danger: true },
        ]} size="sm" />
      </div>
      <div style={S.title}>Writing Practice</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['task 1', 'Task 1'], ['task 2', 'Task 2'], ['discussion', 'Discussion'], ['agree', 'Agree/Disagree']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPromptIdx(0); }} style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filter === val ? 'var(--accent)' : 'var(--bg3)', color: filter === val ? '#fff' : 'var(--muted)', border: '1px solid var(--border)',
          }}>{label}</button>
        ))}
      </div>

      <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={S.pill('var(--accent)')}>{current.type}</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--muted)' }}><span>{timer.fmt}</span><span>{target}+ words</span></div>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{current.prompt}</div>
      </Card>

      {!submitted ? (
        <Card>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
            placeholder="Start writing your response"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 14, color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 13, color: words >= target ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>{words} / {target} words</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setPromptIdx((i) => (i + 1) % prompts.length)}>New Prompt</Button>
              <Button size="sm" disabled={words < target / 2} onClick={() => setSubmitted(true)}>Submit</Button>
            </div>
          </div>
          <div style={{ marginTop: 10 }}><ProgBar pct={Math.min(100, (words / target) * 100)} color={words >= target ? 'var(--success)' : 'var(--accent)'} /></div>
        </Card>
      ) : (
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Submitted</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[{ l: 'Words', v: words, c: 'var(--accent)' }, { l: 'Target', v: target, c: 'var(--muted)' }, { l: 'Time Left', v: timer.fmt, c: 'var(--success)' }].map((s, i) => (
              <div key={i} style={S.statBox(s.c)}><div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.l}</div></div>
            ))}
          </div>
          {current.criteria.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" /><span>{c}</span></div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button onClick={() => { setSubmitted(false); setText(''); setPromptIdx((i) => (i + 1) % prompts.length); }}>Next Prompt</Button>
            <Button variant="outline" onClick={onBack}>Back to Games</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function GamesPage() {
  const [mode, setMode] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizConfig, setQuizConfig] = useState({ count: 10, diff: 'all' });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const startQuiz = (catId, config = quizConfig) => {
    let questions;
    if (catId === 'mixed') {
      questions = getMixedQuiz(config.count);
    } else if (catId === 'adaptive') {
      questions = getAdaptiveQuestions([], config.count);
    } else {
      questions = getQuestions(catId, config.count, config.diff === 'all' ? null : config.diff);
    }
    if (!questions.length) return;
    const cat = CATEGORIES.find((c) => c.id === catId);
    setCurrentQuiz({ questions, catId, title: catId === 'mixed' ? 'Mixed IELTS Drill' : catId === 'adaptive' ? 'Adaptive Drill' : `${cat?.label || 'Practice'} Quiz` });
    setMode('quiz');
  };

  const onQuizDone = (result) => {
    setHistory((h) => [{ ...result, title: currentQuiz?.title, date: new Date().toLocaleDateString(), id: Date.now() }, ...h].slice(0, 10));
  };

  if (mode === 'speaking') return <SpeakingPractice onBack={() => setMode('home')} />;
  if (mode === 'writing') return <WritingPractice onBack={() => setMode('home')} />;
  if (mode === 'quiz' && currentQuiz) {
    return (
      <QuizEngine
        questions={currentQuiz.questions}
        quizTitle={currentQuiz.title}
        category={currentQuiz.catId}
        onDone={onQuizDone}
        onBack={() => setMode('home')}
      />
    );
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={S.title}>Games Arena</div>
        <DotMenu items={[
          { icon: 'Stats', label: showHistory ? 'Hide History' : 'Show History', action: () => setShowHistory((h) => !h) },
          { icon: 'Clear', label: 'Clear History', action: () => setHistory([]), danger: true },
        ]} />
      </div>
      <div style={S.sub}>{TOTAL_QUESTIONS} questions across {CATEGORIES.length} categories.</div>

      {showHistory && history.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent Quiz History</div>
          {history.map((h) => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{h.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{h.date}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{h.score}/{h.total} ({Math.round((h.score / h.total) * 100)}%)</div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: 'Speaking', label: 'Speaking Practice', desc: 'Cue card drills with prep + speak timers', action: () => setMode('speaking'), color: '#c53030' },
          { icon: 'Writing', label: 'Writing Practice', desc: 'Timed essays with self-check criteria', action: () => setMode('writing'), color: '#2b6cb0' },
          { icon: 'Mixed', label: 'Mixed Drill', desc: 'Random questions from all categories', action: () => startQuiz('mixed'), color: '#6b46c1' },
        ].map((m, i) => (
          <Card key={i} style={{ cursor: 'pointer', border: `2px solid ${m.color}30`, background: `${m.color}08`, transition: 'all 200ms' }}
            onClick={m.action}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: m.color }}>{m.label}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.desc}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Quiz Settings</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Questions</label>
            <select value={quizConfig.count} onChange={(e) => setQuizConfig((q) => ({ ...q, count: +e.target.value }))}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13 }}>
              {[5, 10, 15, 20, 25].map((n) => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Difficulty</label>
            <select value={quizConfig.diff} onChange={(e) => setQuizConfig((q) => ({ ...q, diff: e.target.value }))}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13 }}>
              <option value="all">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </Card>

      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Choose a Category</div>
      <div style={S.grid2}>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} style={S.catCard(selectedCategory === cat.id, cat.color)} onClick={() => setSelectedCategory(cat.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
              <DotMenu items={[
                { icon: 'Start', label: 'Quick Start (10Q)', action: () => startQuiz(cat.id, { count: 10, diff: 'all' }) },
                { icon: 'Speed', label: 'Speed Round (5Q)', action: () => startQuiz(cat.id, { count: 5, diff: 'all' }) },
                { icon: 'Hard', label: 'Advanced Only', action: () => startQuiz(cat.id, { count: 10, diff: 'advanced' }) },
              ]} size="sm" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: cat.color, marginBottom: 2 }}>{cat.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cat.count} questions</div>
          </div>
        ))}
      </div>

      {selectedCategory && (
        <div className="fade-up" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={() => startQuiz(selectedCategory)} style={{ flex: 1 }}>
            Start {CATEGORIES.find((c) => c.id === selectedCategory)?.label} Quiz ({quizConfig.count} Q)
          </Button>
          <DotMenu items={[
            { icon: 'Speed', label: 'Speed Round (5Q)', action: () => startQuiz(selectedCategory, { count: 5, diff: 'all' }) },
            { icon: 'Hard', label: 'Hard Mode', action: () => startQuiz(selectedCategory, { count: quizConfig.count, diff: 'advanced' }) },
            { icon: 'Adaptive', label: 'Adaptive Drill', action: () => startQuiz('adaptive', { count: quizConfig.count, diff: 'all' }) },
          ]} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 24 }}>
        {[
          { label: 'Total Questions', value: TOTAL_QUESTIONS, color: 'var(--accent)' },
          { label: 'Categories', value: CATEGORIES.length, color: 'var(--gold)' },
          { label: 'Quizzes Taken', value: history.length, color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} style={S.statBox(s.color)}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
