import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submissionsAPI, aiAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressRing, ProgressBar } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';

const SKILLS = ['speaking', 'writing', 'reading', 'listening'];
const SKILL_COLORS = {
  speaking: 'var(--accent)', writing: 'var(--purple)',
  reading: 'var(--warn)', listening: 'var(--success)',
};

export default function ProgressPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyPlan, setStudyPlan] = useState(null);
  const [nextDrill, setNextDrill] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingDrill, setLoadingDrill] = useState(false);

  const loadAiPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await aiAPI.getStudyPlan();
      setStudyPlan(res);
    } catch {
      setStudyPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const generateDrill = async () => {
    setLoadingDrill(true);
    try {
      const preferredSkill = studyPlan?.priority_skills?.[0] || 'writing';
      const res = await aiAPI.getNextDrill({ preferred_skill: preferredSkill, minutes: 20 });
      setNextDrill(res);
    } catch {
      setNextDrill(null);
    } finally {
      setLoadingDrill(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    submissionsAPI.getStudentSubs(user.id)
      .then((res) => setSubs(res || []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));

    loadAiPlan();
  }, [user]);

  // Compute skill breakdown
  const skillStats = SKILLS.map((skill) => {
    const skillSubs = subs.filter((s) => s.task?.type === skill);
    const reviewed = skillSubs.filter((s) => s.status === 'reviewed').length;
    const total = skillSubs.length;
    return { skill, reviewed, total, pct: total ? Math.round((reviewed / total) * 100) : 0 };
  });

  const totalReviewed = subs.filter((s) => s.status === 'reviewed').length;
  const overallPct = subs.length ? Math.round((totalReviewed / subs.length) * 100) : 0;

  // Weekly activity (last 7 days)
  const now = Date.now();
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * 86400000);
    const label = day.toLocaleDateString('en', { weekday: 'short' });
    const count = subs.filter((s) => {
      const d = new Date(s.submitted_at);
      return d.toDateString() === day.toDateString();
    }).length;
    return { label, count };
  });
  const maxCount = Math.max(...weekly.map((w) => w.count), 1);

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Progress Analytics 📊
      </div>

      {/* Overall */}
      <Card className="fade-up-2" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <ProgressRing pct={overallPct} size={100} stroke={8} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{totalReviewed}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>tasks reviewed</div>
          <div style={{ fontSize: 13 }}>
            Total submissions: <strong>{subs.length}</strong> ·
            Streak: <strong style={{ color: 'var(--gold)' }}>{user?.streak || 0} 🔥</strong>
          </div>
          {user?.score > 0 && (
            <Badge label={`Est. Band ${user.score}`} color="success" style={{ marginTop: 8 }} />
          )}
        </div>
      </Card>

      {/* Skill breakdown */}
      <Card className="fade-up-3" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Skill Breakdown</div>
        {skillStats.map(({ skill, reviewed, total, pct }) => (
          <div key={skill} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
              <span>{skill}</span>
              <span style={{ color: SKILL_COLORS[skill], fontWeight: 700 }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color={SKILL_COLORS[skill]} height={8} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {reviewed}/{total} reviewed
            </div>
          </div>
        ))}
      </Card>

      {/* Weekly activity */}
      <Card className="fade-up-4">
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Weekly Activity</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
          {weekly.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', maxWidth: 28,
                height: `${Math.max(4, (w.count / maxCount) * 60)}px`,
                background: w.count > 0 ? 'var(--accent)' : 'var(--border)',
                borderRadius: 4,
                transition: 'height 0.5s ease',
              }} title={`${w.count} submission(s)`} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{w.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="fade-up" style={{ marginTop: 16, border: '1px solid rgba(20,108,114,.25)', background: 'rgba(20,108,114,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>AI Study Coach</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="outline" onClick={loadAiPlan} loading={loadingPlan}>Refresh Plan</Button>
            <Button size="sm" onClick={generateDrill} loading={loadingDrill}>Generate Next Drill</Button>
          </div>
        </div>

        {studyPlan ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 10 }}>{studyPlan.coach_message}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {(studyPlan.priority_skills || []).map((skill) => (
                <Badge key={skill} label={`Focus: ${skill}`} color="accent" />
              ))}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(studyPlan.weekly_plan || []).slice(0, 3).map((day) => (
                <div key={day.day} style={{ padding: 10, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Day {day.day}: {day.focus_skill}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{day.mission}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>AI study plan not available yet.</div>
        )}

        {nextDrill && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Next Best Drill: {nextDrill.drill?.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>{nextDrill.drill?.prompt}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Success: {nextDrill.drill?.success_criteria}</div>
          </div>
        )}
      </Card>
    </div>
  );
}
