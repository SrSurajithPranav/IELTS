import React, { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressRing } from '../../components/ui/Progress';
import { useNotification } from '../../contexts/NotificationContext';

const MOCK_BANK = {
  writing: {
    title: 'Writing Task 2: Public Space Priority',
    duration: 40, wordTarget: 250,
    prompt: 'Some people argue that city budgets should prioritize public parks and libraries rather than sports arenas. Discuss both views and give your opinion.',
    checklist: [
      'State your position clearly in the introduction.',
      'Use one paragraph per main argument.',
      'Support each argument with a practical example.',
      'Write a short conclusion that reinforces your view.',
    ],
  },
  reading: {
    title: 'Reading Passage: The Night Shift Effect',
    duration: 20, wordTarget: 40,
    prompt: 'A workplace study tracked 600 hospital employees over eight years. Researchers found that workers on rotating shifts reported lower sleep quality and higher stress. However, teams with predictable rosters and recovery days showed better concentration scores. The report recommends fixed schedules, mandatory quiet rooms, and hydration reminders during overnight hours.',
    checklist: [
      'TRUE/FALSE: The study lasted fewer than five years.',
      'TRUE/FALSE: Predictable rosters improved concentration.',
      'Choose TWO recommendations from the passage.',
      'Write a one-sentence summary in your own words.',
    ],
  },
  listening: {
    title: 'Listening Notes: Campus Orientation',
    duration: 15, wordTarget: 40,
    prompt: 'You hear a student advisor explain orientation week. New students must collect ID cards before Wednesday, register for workshops online, and join one study group session. The library tour starts at 11:30, while language support appointments open on Friday.',
    checklist: [
      'What must be collected before Wednesday?',
      'How should workshops be registered?',
      'At what time does the library tour begin?',
      'On which day do language appointments open?',
    ],
  },
  speaking: {
    title: 'Speaking Part 2: A Skill You Learned',
    duration: 10, wordTarget: 40,
    prompt: 'Describe a skill you learned recently. You should say when you started learning it, what challenges you faced, how you practiced, and why it is useful for your future.',
    checklist: [
      'Speak for 1 to 2 minutes.',
      'Use specific examples instead of general statements.',
      'Include one difficulty and how you solved it.',
      'Finish with a future goal.',
    ],
  },
};

export default function MockTestPage() {
  const { error: notifyError } = useNotification();
  const [skill, setSkill] = useState('writing');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const test = MOCK_BANK[skill];
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);

  useEffect(() => {
    setTimeLeft(MOCK_BANK[skill].duration * 60);
    setSubmitted(false); setResult(null); setText('');
  }, [skill]);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setTimeLeft((prev) => {
      if (prev <= 1) { clearInterval(t); setSubmitted(true); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [skill, submitted]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const timerPct = Math.round((timeLeft / (test.duration * 60)) * 100);

  const handleSubmit = async () => {
    setSubmitted(true);
    if ((skill === 'writing' || skill === 'speaking') && text.trim()) {
      setAnalyzing(true);
      try {
        const res = skill === 'writing'
          ? await aiAPI.analyzeWriting(text)
          : await aiAPI.analyzeSpeaking(text);
        setResult(res);
        // Persist so teachers can review mock-test submissions
        const label = `Mock Test – ${skill[0].toUpperCase() + skill.slice(1)} – ${test.title}`;
        submissionsAPI.submitStandalone(label, text).catch(() => {});
      } catch (e) {
        notifyError(e.message || 'AI analysis failed');
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Mock Test Studio ⏱
      </div>

      <div className="fade-up-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.keys(MOCK_BANK).map((k) => (
          <Button key={k} size="sm" variant={skill === k ? 'primary' : 'outline'} onClick={() => setSkill(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </Button>
        ))}
      </div>

      {/* Timer card */}
      <Card className="fade-up-3" style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--accent-soft), var(--gold-soft))', border: '1px solid var(--accent-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{test.title}</div>
            <div style={{
              fontFamily: 'Fraunces, serif', fontSize: 42, fontWeight: 700,
              color: timeLeft < 300 ? 'var(--danger)' : 'var(--warn)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(timeLeft)}
            </div>
            {submitted && <Badge label="Time's up!" color="danger" style={{ marginTop: 6 }} />}
          </div>
          <ProgressRing
            pct={timerPct} size={90} stroke={7}
            color={timeLeft < 120 ? 'var(--danger)' : 'var(--accent)'}
          />
        </div>
      </Card>

      {/* Test card */}
      <Card className="fade-up-4">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{test.title}</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>{test.prompt}</p>
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid var(--accent-glow)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: 'var(--accent)' }}>CHECKLIST</div>
          {test.checklist.map((c, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>• {c}</div>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          placeholder="Write your response here…"
          rows={10}
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            opacity: submitted ? 0.6 : 1,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {wordCount} words {wordCount >= test.wordTarget && '✓ Min reached'}
          </span>
          {!submitted && (
            <Button onClick={handleSubmit} disabled={wordCount < (skill === 'reading' || skill === 'listening' ? 5 : 20)}>
              Submit Test
            </Button>
          )}
        </div>
      </Card>

      {/* AI Result */}
      {(analyzing || result) && (
        <Card style={{ marginTop: 16, border: '1px solid var(--accent-glow)' }}>
          {analyzing ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>🔍 Analyzing your response…</div>
          ) : result && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700 }}>AI Evaluation</div>
                <Badge label={`Band ${result.band_estimate}`} color="success" />
              </div>
              {result.analysis && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                  {Object.entries(result.analysis)
                    .filter(([k]) => typeof result.analysis[k] === 'number')
                    .map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{v}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, textTransform: 'capitalize' }}>
                          {k.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
