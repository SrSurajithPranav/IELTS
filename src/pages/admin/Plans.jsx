import React, { useState, useEffect } from 'react';
import { plansAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SkeletonGrid } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

export default function AdminPlans() {
  const { success, error: notifyError } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', duration_days: 30, session_type: 'solo', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => plansAPI.getAll()
    .then((res) => setPlans(res || []))
    .catch(() => setPlans([]))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const createPlan = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await plansAPI.create(form);
      success('Plan created!');
      setCreateOpen(false);
      setForm({ name: '', duration_days: 30, session_type: 'solo', description: '' });
      load();
    } catch (e) { notifyError(e.message || 'Failed to create plan'); }
    finally { setSaving(false); }
  };

  const inp = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }} className="fade-up">
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700 }}>Plans 📋</div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ New Plan</Button>
      </div>

      {loading ? <SkeletonGrid count={4} cardHeight={180} /> : (
        <div className="fade-up-2" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {plans.length === 0 && (
            <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', gridColumn: '1/-1' }}>
              No plans yet. Create the first one!
            </Card>
          )}
          {plans.map((p) => (
            <Card key={p.id} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                <Badge label={`${p.duration_days}d`} color="accent" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Mode: {p.session_type}</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                {p.description || 'Structured IELTS training plan.'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Button size="sm" variant="outline" style={{ flex: 1 }}>Configure Tasks</Button>
                <Button size="sm" style={{ flex: 1 }}>Assign</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Plan"
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={createPlan} loading={saving} disabled={!form.name.trim()}>Create</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Plan Name</label>
            <input style={inp} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. 60-Day Intensive" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Duration (days)</label>
            <input type="number" style={inp} value={form.duration_days} onChange={(e) => setForm((c) => ({ ...c, duration_days: +e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Session Type</label>
            <select style={inp} value={form.session_type} onChange={(e) => setForm((c) => ({ ...c, session_type: e.target.value }))}>
              <option value="solo">Solo</option>
              <option value="group">Group</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Description / Pricing</label>
            <textarea rows={3} style={inp} value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="e.g. INR 10000 for 60 days, every 2 days session" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
