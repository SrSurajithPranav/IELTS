import React, { useState, useEffect } from 'react';
import { plansAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonGrid } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

export default function PlansPage() {
  const { success, error: notifyError } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [choosing, setChoosing] = useState(null);

  useEffect(() => {
    Promise.all([plansAPI.getAll(), plansAPI.getMy()])
      .then(([all, my]) => {
        setPlans(all || []);
        setActivePlan(my?.active_plan || null);
        setActivePlanId(my?.active_plan?.plan_id || null);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const choosePlan = async (planId) => {
    setChoosing(planId);
    try {
      await plansAPI.select(planId);
      setActivePlanId(planId);
      success('Plan selected! Your tasks will update from tomorrow.');
    } catch (e) {
      notifyError(e.message || 'Could not select plan.');
    } finally {
      setChoosing(null);
    }
  };

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Training Plans 💼
      </div>
      <p className="fade-up-2" style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
        Solo plans include 1:1 coaching every 2 days. Group plans require attendance from all enrolled members.
      </p>

      {activePlan?.due_date && (
        <Card style={{ marginBottom: 16, border: '1px solid rgba(20,108,114,.22)', background: 'rgba(20,108,114,.05)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Current plan deadline</div>
          <div style={{ fontWeight: 700 }}>
            Due {activePlan.due_date} · reminder window {activePlan.reminder_days ?? 3} day(s)
          </div>
        </Card>
      )}

      {loading ? (
        <SkeletonGrid count={4} cardHeight={180} />
      ) : plans.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No plans available. Ask your teacher to create a plan.
        </Card>
      ) : (
        <div className="fade-up-3" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {plans.map((p) => {
            const isActive = activePlanId === p.id;
            return (
              <Card
                key={p.id}
                hover
                accent={isActive ? 'var(--accent)' : undefined}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>
                    {p.name}
                  </div>
                  <Badge label={`${p.duration_days}d`} color="accent" />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Mode: <strong>{p.session_type}</strong>
                </div>
                {activePlanId === p.id && activePlan?.due_date && (
                  <div style={{ fontSize: 12, color: 'var(--warn)', fontWeight: 600 }}>
                    Due {activePlan.due_date}
                  </div>
                )}
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, flex: 1 }}>
                  {p.description || 'Structured IELTS roadmap with speaking, writing, reading, and listening tasks.'}
                </p>
                {isActive ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--success-soft)', border: '1px solid rgba(47,133,90,.2)',
                    fontSize: 13, fontWeight: 700, color: 'var(--success)',
                  }}>
                    ✓ Active Plan
                  </div>
                ) : (
                  <Button
                    fullWidth
                    onClick={() => choosePlan(p.id)}
                    loading={choosing === p.id}
                  >
                    Choose Plan
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
