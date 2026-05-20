import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submissionsAPI, aiAPI, pushMistakeMemory } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

const TASK1_PROMPTS = [
  "The graph shows electricity consumption in different sectors from 2000-2020. Summarize the information and make comparisons where relevant.",
  "The diagram below shows how a water filtration system works. Summarize the information by selecting and reporting the main features.",
];
const TASK2_PROMPTS = [
  "Some people believe that technology has made people's lives simpler, while others believe it has made lives more complicated. Discuss both views and give your own opinion.",
  "In many countries, the gap between the rich and poor is increasing. What are the causes of this problem and what solutions can you suggest?",
  "Some people think that children today are not as fit and healthy as they were in the past. Why is this? What can be done to improve this?",
];

export default function WritingPage() {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [taskType, setTaskType] = useState('task2');
  const [prompt, setPrompt] = useState(TASK2_PROMPTS[0]);
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [rewrite, setRewrite] = useState(null);
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [brainstorm, setBrainstorm] = useState(null);
  const [brainstorming, setBrainstorming] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    submissionsAPI.getStudentSubs(user.id)
      .then((res) => setSubs((res || []).filter((s) => s.task?.type === 'writing')))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, [user]);

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minWords = taskType === 'task2' ? 250 : 150;
  const prompts = taskType === 'task2' ? TASK2_PROMPTS : TASK1_PROMPTS;

  const analyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true); setAnalysis(null);
    try {
      const res = await aiAPI.analyzeWriting(text);
      setAnalysis(res);
      pushMistakeMemory(['writing', ...(res?.analysis?.suggestions || [])]);
    } catch (e) { notifyError(e.message || 'Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const doRewrite = async () => {
    if (!text.trim()) return;
    setRewriting(true); setRewrite(null);
    try { setRewrite(await aiAPI.rewriteBand9(text)); }
    catch (e) { notifyError(e.message || 'Rewrite failed'); }
    finally { setRewriting(false); }
  };

  const runBrainstorm = async () => {
    const topic = brainstormTopic.trim() || prompt;
    if (!topic) return;
    setBrainstorming(true);
    setBrainstorm(null);
    try {
      const res = await aiAPI.brainstormWriting(topic, taskType === 'task2' ? 'balanced' : 'agree');
      setBrainstorm(res);
      success('AI brainstorming ready');
    } catch (e) {
      notifyError(e.message || 'Brainstorm failed');
    } finally {
      setBrainstorming(false);
    }
  };

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Writing Lab ✍️
      </div>

      {/* Task Selector */}
      <Card className="fade-up-2" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['task1', 'task2'].map((t) => (
            <Button key={t} size="sm" variant={taskType === t ? 'primary' : 'outline'} onClick={() => { setTaskType(t); setPrompt(t === 'task2' ? TASK2_PROMPTS[0] : TASK1_PROMPTS[0]); }}>
              {t === 'task2' ? 'Task 2 (Essay)' : 'Task 1 (Report)'}
            </Button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
          <strong>Prompt:</strong>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)', marginBottom: 12 }}>{prompt}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {prompts.map((p, i) => (
            <Button key={i} size="xs" variant={prompt === p ? 'soft' : 'ghost'} onClick={() => setPrompt(p)}>
              Prompt {i + 1}
            </Button>
          ))}
        </div>
      </Card>

      {/* Editor */}
      <Card className="fade-up-3" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>Your Response</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: wordCount >= minWords ? 'var(--success)' : 'var(--muted)' }}>
            {wordCount} / {minWords} words
          </span>
        </div>
        <ProgressBar pct={Math.min(100, (wordCount / minWords) * 100)} height={4} style={{ marginBottom: 10 }} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Begin writing your response here…"
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 16, color: 'var(--text)', fontSize: 14,
            lineHeight: 1.7, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Button onClick={analyze} disabled={wordCount < 20 || analyzing} loading={analyzing}>
            🔍 Analyze
          </Button>
          <Button variant="outline" onClick={doRewrite} disabled={wordCount < 20 || rewriting} loading={rewriting}>
            ✨ Band 9 Rewrite
          </Button>
          <Button variant="ghost" onClick={() => setText('')} disabled={!text}>
            Clear
          </Button>
        </div>
      </Card>

      <Card className="fade-up" style={{ marginBottom: 16, border: '1px solid rgba(20,108,114,.25)', background: 'rgba(20,108,114,.05)' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>AI Idea Generator</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <input
            value={brainstormTopic}
            onChange={(e) => setBrainstormTopic(e.target.value)}
            placeholder="Optional custom topic (leave empty to use current prompt)"
            style={{
              flex: 1,
              minWidth: 240,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 12px',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <Button onClick={runBrainstorm} loading={brainstorming}>Generate Ideas</Button>
        </div>

        {brainstorm && (
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Thesis</div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>{brainstorm.thesis}</div>

            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Body Ideas</div>
            {(brainstorm.body_ideas || []).map((idea, idx) => (
              <div key={idx} style={{ marginBottom: 8, fontSize: 12, color: 'var(--text)' }}>
                <strong>{idea.point}:</strong> {idea.detail} <em>{idea.example}</em>
              </div>
            ))}

            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 6 }}>Useful Vocabulary</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(brainstorm.vocabulary || []).map((word) => (
                <Badge key={word} label={word} color="accent" />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Analysis */}
      {analysis && (
        <Card className="fade-up" style={{ marginBottom: 16, border: '1px solid var(--accent-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700 }}>AI Writing Analysis</div>
            <Badge label={`Est. Band ${analysis.band_estimate}`} color="success" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Grammar', val: analysis.analysis?.grammar_score },
              { label: 'Vocabulary', val: analysis.analysis?.vocabulary_richness != null ? Math.round(analysis.analysis.vocabulary_richness * 100) : '—' },
              { label: 'Error Count', val: analysis.analysis?.error_count ?? '—' },
              { label: 'Word Count', val: wordCount },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{m.val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {analysis.analysis?.suggestions?.length > 0 && (
            <>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Suggestions:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                {analysis.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
        </Card>
      )}

      {/* Rewrite */}
      {rewrite && (
        <Card className="fade-up" style={{ marginBottom: 16, border: '1px solid var(--gold-soft)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>✨ Band 9 Rewritten Version</div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', marginBottom: 14 }}>
            {rewrite.rewritten}
          </div>
          {rewrite.upgrade_notes?.map((note, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 4 }}>💡 {note}</div>
          ))}
        </Card>
      )}

      {/* History */}
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Past Submissions</div>
      {loading ? <SkeletonList count={3} /> : subs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
          No writing submissions yet. Submit from Today's Tasks.
        </Card>
      ) : subs.slice(0, 5).map((s) => (
        <Card key={s.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>{s.task?.title || `Task #${s.task_id}`}</div>
            <StatusBadge status={s.status} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            {(s.content || '').slice(0, 200)}{(s.content || '').length > 200 ? '…' : ''}
          </p>
          {s.feedback_text && (
            <div style={{ marginTop: 10, padding: 10, background: 'var(--success-soft)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>Feedback: </span>
              {s.feedback_text}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
