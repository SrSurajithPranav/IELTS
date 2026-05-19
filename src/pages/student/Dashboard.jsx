import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { tasksAPI, submissionsAPI } from '../../services/api';
import { Card, StatCard } from '../../components/ui/Card';
import { ProgressRing, ProgressBar } from '../../components/ui/Progress';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import AnnouncementBanner from '../../components/AnnouncementBanner';

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening'];
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? GREETINGS[0] : h < 17 ? GREETINGS[1] : GREETINGS[2];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [todayTasks, setTodayTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([tasksAPI.getToday(), submissionsAPI.getStudentSubs(user.id)])
      .then(([tasksRes, subsRes]) => {
        setTodayTasks(tasksRes?.tasks || []);
        setSubmissions(subsRes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const submittedIds = new Set(submissions.map((s) => s.task_id));
  const reviewed = submissions.filter((s) => s.status === 'reviewed').length;
  const submitted = submissions.filter((s) => s.status === 'submitted').length;
  const completed = submissions.filter(
    (s) => s.status === 'reviewed' || s.status === 'submitted'
  ).length;
  const total = todayTasks.length || 1;
  const pct = Math.round((completed / total) * 100);
  const currentDay = todayTasks[0]?.day_number || '—';
  const recentFeedback = submissions.filter((s) => s.feedback_text).slice(0, 3);

  const stats = [
    { label: 'Current Day',   value: `Day ${currentDay}`, icon: '📅', color: 'var(--accent)' },
    { label: 'Est. Score',    value: user?.score || 0,    icon: '🎯', color: 'var(--gold)' },
    { label: 'Streak',        value: `${user?.streak || 0}🔥`, icon: '', color: 'var(--warn)' },
    { label: 'Tasks Reviewed',value: reviewed,            icon: '✅', color: 'var(--success)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome */}
      <motion.div className="fade-up">
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700 }}>
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          {pct === 100
            ? "🎉 All tasks done today — incredible work!"
            : `You've completed ${completed} of ${total} tasks today. Keep going!`}
        </p>
      </motion.div>

      {/* Announcement */}
      <AnnouncementBanner />

      {/* Stats row */}
      <div className="fade-up-2" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
      }}>
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Today's Progress */}
      <Card className="fade-up-3" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Today's Progress</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {completed} of {todayTasks.length} tasks done
              {submitted > 0 && <span> · {submitted} awaiting review</span>}
            </div>
          </div>
          <ProgressRing pct={pct} size={72} stroke={6} />
        </div>
        <ProgressBar pct={pct} height={8} />

        {/* Task type pills */}
        {loading ? (
          <div style={{ marginTop: 12 }}>
            <SkeletonList count={3} cardHeight={50} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {todayTasks.map((t) => {
              const done = submittedIds.has(t.id);
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px',
                  borderRadius: 99,
                  background: done ? 'var(--success-soft)' : 'var(--bg3)',
                  border: `1px solid ${done ? 'rgba(47,133,90,.2)' : 'var(--border)'}`,
                  fontSize: 12, fontWeight: 500,
                  color: done ? 'var(--success)' : 'var(--muted)',
                }}>
                  {done ? '✓' : '○'} {t.type}
                </div>
              );
            })}
          </div>
        )}

        {/* Perfect day badge */}
        {pct === 100 && total > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: 14, display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: 'var(--gold-soft)',
              borderRadius: 10,
              border: '1px solid rgba(214,148,41,.2)',
            }}
          >
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gold)' }}>Perfect Day!</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>All tasks completed. Your streak continues!</div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Recent Feedback */}
      <Card className="fade-up-4">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent Feedback 💬</div>
        {recentFeedback.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0', textAlign: 'center' }}>
            No feedback yet. Complete and submit tasks to get teacher reviews.
          </div>
        ) : (
          recentFeedback.map((s) => (
            <div key={s.id} style={{
              padding: '14px',
              background: 'var(--bg3)',
              borderRadius: 12,
              marginBottom: 10,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {s.task?.title || `Task #${s.task_id}`}
                  </span>
                  {s.task?.type && (
                    <span style={{ marginLeft: 8 }}>
                      <Badge label={s.task.type} color={
                        { speaking: 'accent', writing: 'purple', listening: 'success', reading: 'warn' }[s.task.type] || 'muted'
                      } size="xs" />
                    </span>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                {s.feedback_text}
              </p>
              {s.feedback_audio_url && (
                <audio controls src={s.feedback_audio_url} style={{ marginTop: 8, width: '100%', height: 32 }} />
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
