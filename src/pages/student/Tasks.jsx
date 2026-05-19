import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { tasksAPI, submissionsAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, TaskTypeBadge, StatusBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

const ICON_MAP = { speaking: '🎧', writing: '✍️', listening: '📻', reading: '📖', grammar: '📝' };
const COLOR_MAP = {
  speaking: 'var(--accent)', writing: 'var(--purple)',
  listening: 'var(--success)', reading: 'var(--warn)', grammar: 'var(--gold)',
};

function AudioRecorder({ onBlob }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const recRef = useRef(null);
  const timerRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunks, { type: 'audio/webm' });
        setBlob(b);
        onBlob(b);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    } catch {
      alert('Microphone access denied.');
    }
  };

  const stop = () => {
    recRef.current?.stop();
    recRef.current?.stream?.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      padding: 20, background: 'var(--bg3)', borderRadius: 12,
      border: '1px solid var(--border)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>
        {recording ? (
          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1s infinite' }} />
            Recording {fmt(elapsed)}
          </span>
        ) : blob ? '✅ Recording saved' : '🎙 Ready to record'}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant={recording ? 'danger' : 'outline'}
          onClick={recording ? stop : start}
          size="sm"
        >
          {recording ? `⏹ Stop` : '⏺ Record'}
        </Button>
        {blob && (
          <audio controls src={URL.createObjectURL(blob)} style={{ height: 32 }} />
        )}
        <label style={{
          padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--border)',
          fontSize: 12, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer',
        }}>
          📁 Upload
          <input type="file" accept="audio/*" style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.[0]) { setBlob(e.target.files[0]); onBlob(e.target.files[0]); } }} />
        </label>
      </div>
    </div>
  );
}

function TaskCard({ task, submission, onSubmitted }) {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const color = COLOR_MAP[task.type] || 'var(--accent)';
  const isSubmitted = !!submission;
  const isReviewed = submission?.status === 'reviewed';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const needsText = ['writing', 'grammar', 'reading'].includes(task.type);
  const needsAudio = task.type === 'speaking';
  const canSubmit = needsAudio ? !!audioBlob : (needsText ? wordCount >= 5 : true);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submissionsAPI.submit(task.id, text, audioBlob);
      notifySuccess('Submission sent successfully!');
      setExpanded(false);
      onSubmitted?.();
    } catch (e) {
      notifyError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{
      marginBottom: 12,
      borderLeft: `3px solid ${color}`,
      padding: 0,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: isSubmitted ? 'default' : 'pointer' }}
        onClick={() => !isSubmitted && setExpanded((e) => !e)}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {ICON_MAP[task.type] || '📋'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</span>
            <TaskTypeBadge type={task.type} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>⏱ {task.duration}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusBadge status={isReviewed ? 'reviewed' : isSubmitted ? 'submitted' : 'pending'} />
          {!isSubmitted && (
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: '16px 0', lineHeight: 1.6 }}>
                {task.description || task.desc}
              </p>

              {needsText && (
                <div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your response here…"
                    rows={6}
                    style={{
                      width: '100%', background: 'var(--bg3)',
                      border: '1px solid var(--border)', borderRadius: 10,
                      padding: 14, color: 'var(--text)', fontSize: 13,
                      resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: wordCount >= 150 ? 'var(--success)' : 'var(--muted)' }}>
                      {wordCount} words {wordCount >= 150 && '✓'}
                    </span>
                    <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting} size="sm">
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              {needsAudio && (
                <div>
                  <AudioRecorder onBlob={setAudioBlob} />
                  <div style={{ marginTop: 12 }}>
                    <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting} size="sm">
                      Submit Recording
                    </Button>
                  </div>
                </div>
              )}

              {!needsText && !needsAudio && (
                <div>
                  <div style={{
                    padding: 14, background: 'var(--bg3)', borderRadius: 10,
                    fontSize: 13, color: 'var(--muted)', marginBottom: 12,
                  }}>
                    📻 Complete the task from your teacher's materials and mark as done.
                  </div>
                  <Button variant="success" onClick={handleSubmit} loading={submitting} size="sm">
                    Mark Complete
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback strip */}
      {isReviewed && submission?.feedback_text && (
        <div style={{
          padding: '12px 20px',
          background: 'var(--success-soft)',
          borderTop: '1px solid rgba(47,133,90,.15)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>
            📋 Teacher Feedback
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{submission.feedback_text}</div>
        </div>
      )}
    </Card>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const [day, setDay] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [taskRes, subRes] = await Promise.all([
        tasksAPI.getToday(),
        submissionsAPI.getStudentSubs(user.id),
      ]);
      setDay(taskRes?.day || 0);
      setTasks(taskRes?.tasks || []);
      setSubmissions(subRes || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const subMap = {};
  submissions.forEach((s) => { subMap[s.task_id] = s; });
  const completed = tasks.filter((t) => subMap[t.id]).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700 }}>
          Day {day || '—'} Tasks
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
          Complete all tasks to maintain your streak
        </p>
      </div>

      <Card className="fade-up-2" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{completed}/{tasks.length} completed</span>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} height={8} />
      </Card>

      <div className="fade-up-3">
        {loading ? (
          <SkeletonList count={4} cardHeight={70} />
        ) : tasks.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>No tasks today</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Your teacher hasn't assigned tasks yet, or you haven't selected a plan.
            </div>
          </Card>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              submission={subMap[task.id] || null}
              onSubmitted={load}
            />
          ))
        )}
      </div>
    </div>
  );
}
