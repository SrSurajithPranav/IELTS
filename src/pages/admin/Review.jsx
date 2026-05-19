import React, { useState, useEffect } from 'react';
import { submissionsAPI, feedbackAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge, TaskTypeBadge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

export default function AdminReview() {
  const { success, error: notifyError } = useNotification();
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => submissionsAPI.getPending()
    .then((res) => setPending(res || []))
    .catch(() => setPending([]))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const saveFeedback = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await feedbackAPI.create(selected.id, feedback, feedbackFile);
      success('Feedback saved!');
      setSelected(null); setFeedback(''); setFeedbackFile(null);
      load();
    } catch (e) {
      notifyError(e.message || 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Review Submissions 🔍
      </div>
      <p className="fade-up-2" style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
        {pending.length} submission{pending.length !== 1 ? 's' : ''} awaiting feedback
      </p>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', alignItems: 'start' }}>
        {/* List */}
        <div>
          {loading ? (
            <SkeletonList count={5} cardHeight={80} />
          ) : pending.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              🎉 All submissions reviewed!
            </Card>
          ) : pending.map((s) => (
            <Card
              key={s.id}
              hover
              className="fade-up-3"
              style={{ marginBottom: 10, cursor: 'pointer', border: selected?.id === s.id ? '1.5px solid var(--accent)' : '1px solid var(--border)' }}
              onClick={() => { setSelected(s); setFeedback(s.feedback_text || ''); setFeedbackFile(null); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {s.task?.title || `Task #${s.task_id}`}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                <span>📅 {new Date(s.submitted_at).toLocaleString()}</span>
                {s.task?.type && <TaskTypeBadge type={s.task.type} />}
              </div>
              {s.content && (
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                  {s.content.slice(0, 80)}{s.content.length > 80 ? '…' : ''}
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Feedback panel */}
        {selected && (
          <Card className="fade-up" style={{ position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Give Feedback</div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>✕</button>
            </div>

            {/* Summary */}
            <div style={{ padding: 12, background: 'var(--bg3)', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.task?.title || `Task #${selected.task_id}`}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selected.task?.type && <TaskTypeBadge type={selected.task.type} />}
                <StatusBadge status={selected.status} />
              </div>
              {selected.content && (
                <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>
                  {selected.content.slice(0, 300)}{selected.content.length > 300 ? '…' : ''}
                </div>
              )}
            </div>

            {/* Audio playback */}
            {selected.file_url && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Student Recording</div>
                <audio controls src={selected.file_url} style={{ width: '100%', height: 36 }} />
              </div>
            )}

            {/* Feedback text */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Written Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                placeholder="Write detailed, constructive feedback…"
                style={{
                  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 12, color: 'var(--text)', fontSize: 13,
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Audio feedback */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Audio Feedback (optional)</label>
              <input type="file" accept="audio/*" style={{ fontSize: 12, color: 'var(--muted)' }}
                onChange={(e) => setFeedbackFile(e.target.files?.[0] || null)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={saveFeedback} disabled={!feedback.trim() || saving} loading={saving}>
                Save Feedback
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
