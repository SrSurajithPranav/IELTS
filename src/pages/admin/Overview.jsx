import React, { useState, useEffect } from 'react';
import { studentsAPI, submissionsAPI } from '../../services/api';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';

export default function AdminOverview() {
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentsAPI.getAll(), submissionsAPI.getPending()])
      .then(([s, p]) => { setStudents(s || []); setPending(p || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Students', value: students.length, icon: '👥', color: 'var(--accent)' },
    { label: 'Pending Reviews', value: pending.length, icon: '📋', color: 'var(--warn)' },
    { label: 'Active Today', value: students.filter((s) => s.last_active_date === new Date().toISOString().split('T')[0]).length, icon: '✅', color: 'var(--success)' },
    { label: 'Avg Score', value: students.length ? (students.reduce((a, s) => a + (s.score || 0), 0) / students.length).toFixed(1) : '—', icon: '🎯', color: 'var(--gold)' },
  ];

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Admin Overview 📊
      </div>

      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Pending Submissions */}
      <Card className="fade-up-3">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Pending Reviews</div>
        {loading ? <SkeletonList count={5} cardHeight={60} /> :
          pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
              🎉 All submissions reviewed!
            </div>
          ) : pending.slice(0, 8).map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warn)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.task?.title || `Task #${s.task_id}`}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {new Date(s.submitted_at).toLocaleString()}
                </div>
              </div>
              <Badge label={s.task?.type || 'unknown'} color={
                { speaking: 'accent', writing: 'purple', reading: 'warn', listening: 'success' }[s.task?.type] || 'muted'
              } size="xs" />
            </div>
          ))
        }
      </Card>
    </div>
  );
}
