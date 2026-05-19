import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { aiAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const QUIZ_QUESTIONS = [
  { q: "Choose the best connector: 'The train was late, ___ we still arrived on time.'", a: ['however', 'although', 'because', 'so'], c: 0 },
  { q: "Identify the noun phrase in: 'The rapid growth of online classes'", a: ['rapid growth', 'online', 'classes', 'online classes'], c: 0 },
  { q: "Pick the formal alternative to 'kids'.", a: ['children', 'buddies', 'teens', 'guys'], c: 0 },
  { q: "Which sentence is more concise?", a: ['Due to the fact that it rained,', 'Because it rained,', 'Since it did rain,', 'Given that it rained,'], c: 1 },
  { q: "Choose the correct article: '___ university is an important institution.'", a: ['A', 'An', 'The', 'No article'], c: 0 },
  { q: "Which word means 'to make something better'?", a: ['deteriorate', 'enhance', 'diminish', 'restrict'], c: 1 },
];

export default function GamesPage() {
  const { error: notifyError } = useNotification();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const current = QUIZ_QUESTIONS[idx];

  const pick = (optIdx) => {
    if (answered) return;
    setSelected(optIdx);
    setAnswered(true);
    if (optIdx === current.c) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setAnswered(false);
    setSelected(null);
  };

  const reset = () => {
    setIdx(0); setScore(0); setAnswered(false); setSelected(null);
    setFinished(false); setAiAnalysis(null);
  };

  const getAiFeedback = async () => {
    setAnalyzing(true);
    try {
      const res = await aiAPI.analyzeQuiz({
        score: (score / QUIZ_QUESTIONS.length) * 100,
        total: QUIZ_QUESTIONS.length,
        correct: score,
        quiz_title: 'IELTS Quick Drill',
        category: 'grammar',
      });
      setAiAnalysis(res);
    } catch (e) { notifyError(e.message); }
    finally { setAnalyzing(false); }
  };

  if (finished) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div>
        <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          Games Arena 🧩
        </div>
        <Card className="fade-up-2" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            {score}/{QUIZ_QUESTIONS.length} Correct
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 16 }}>{pct}%</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={reset}>Play Again</Button>
            <Button variant="outline" onClick={getAiFeedback} loading={analyzing}>Get AI Feedback</Button>
          </div>
          {aiAnalysis && (
            <div style={{ marginTop: 20, textAlign: 'left', padding: 16, background: 'var(--bg3)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>AI Coach Says:</div>
              {aiAnalysis.analysis?.strengths?.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--success)', marginBottom: 6 }}>✓ {s}</div>
              ))}
              {aiAnalysis.analysis?.suggestions?.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>💡 {s}</div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Games Arena 🧩
      </div>
      <p className="fade-up-2" style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
        Build grammar, vocabulary, and IELTS reflexes with fast drills.
      </p>

      <Card className="fade-up-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
            Question {idx + 1} / {QUIZ_QUESTIONS.length}
          </div>
          <Badge label={`Score ${score}`} color="success" />
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{current.q}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {current.a.map((opt, i) => {
            const isCorrect = answered && i === current.c;
            const isWrong = answered && selected === i && i !== current.c;
            return (
              <button key={i} onClick={() => pick(i)} style={{
                textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : 'var(--border)'}`,
                background: isCorrect ? 'var(--success-soft)' : isWrong ? 'var(--danger-soft)' : 'var(--bg3)',
                color: 'var(--text)', fontSize: 13, cursor: answered ? 'default' : 'pointer',
                fontFamily: 'inherit', transition: 'all 150ms',
              }}>
                {isCorrect ? '✓ ' : isWrong ? '✗ ' : ''}{opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <Button onClick={next} size="sm" variant="outline">
            {idx + 1 >= QUIZ_QUESTIONS.length ? 'See Results' : 'Next →'}
          </Button>
        )}
      </Card>
    </div>
  );
}
