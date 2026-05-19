import React, { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useNotification } from '../../contexts/NotificationContext';

const TOPICS = [
  'Technology improves our lives more than it harms them.',
  'Remote work should become the global standard.',
  'Social media does more harm than good to society.',
  'Countries should prioritize climate change over economic growth.',
  'University education should be free for all citizens.',
];

export default function DebatePage() {
  const { error: notifyError } = useNotification();
  const [topicIdx, setTopicIdx] = useState(0);
  const [stance, setStance] = useState('for');
  const [argument, setArgument] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const topic = TOPICS[topicIdx];

  const analyze = async () => {
    if (!argument.trim()) return;
    setAnalyzing(true); setResult(null);
    try { setResult(await aiAPI.analyzeDebate(topic, argument)); }
    catch (e) { notifyError(e.message || 'Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Debate Mode 🗣️
      </div>
      <p className="fade-up-2" style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
        Practice constructing arguments for and against IELTS-style discussion topics.
      </p>

      {/* Topic */}
      <Card className="fade-up-3" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Debate Topic</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {TOPICS.map((t, i) => (
            <button key={i} onClick={() => { setTopicIdx(i); setResult(null); setArgument(''); }}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12,
                background: topicIdx === i ? 'var(--accent-soft)' : 'var(--bg3)',
                color: topicIdx === i ? 'var(--accent)' : 'var(--muted)',
                border: `1px solid ${topicIdx === i ? 'var(--accent-glow)' : 'var(--border)'}`,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}>
              Topic {i + 1}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
          "{topic}"
        </div>
      </Card>

      {/* Stance */}
      <Card className="fade-up-4" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Your Stance</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {['for', 'against'].map((s) => (
            <Button key={s} size="sm" variant={stance === s ? 'primary' : 'outline'} onClick={() => setStance(s)}>
              {s === 'for' ? '👍 For' : '👎 Against'}
            </Button>
          ))}
        </div>
        <textarea
          value={argument}
          onChange={(e) => setArgument(e.target.value)}
          rows={6}
          placeholder={`Write your argument ${stance} the topic above. Use connectors (however, therefore, moreover) and give examples…`}
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
          <Button onClick={analyze} disabled={argument.trim().split(/\s+/).length < 10 || analyzing} loading={analyzing}>
            🔍 Evaluate Argument
          </Button>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {argument.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card className="fade-up" style={{ border: '1px solid var(--accent-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>AI Feedback</div>
            <Badge label={`Band ${result.band_estimate}`} color="success" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Argument Strength', val: result.analysis?.argument_strength },
              { label: 'Structure', val: result.analysis?.structure_score },
              { label: 'Vocabulary', val: result.analysis?.vocabulary_score },
              { label: 'Connectors', val: result.analysis?.connector_count },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{m.val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Tips to improve:</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>
            {(result.analysis?.tips || []).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
