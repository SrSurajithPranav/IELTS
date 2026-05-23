import React, { useState, useEffect, useRef } from 'react';
import { studentsAPI, plansAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';
import DotMenu from '../../components/ui/DotMenu';

function ThreeDotMenu({ items }) {
  return (
    <DotMenu
      items={items.map((item) => (
        item === 'divider'
          ? '---'
          : {
              icon: item.icon,
              label: item.label,
              danger: item.danger,
              action: item.onClick,
            }
      ))}
    />
  );
}

function StudentProfileModal({ student, plans, open, onClose, onSaved }) {
  const { success, error: notifyError } = useNotification();
  const [tab, setTab] = useState('info');
  const [editForm, setEditForm] = useState({ name: '', zoom_link: '', weak_areas: '' });
  const [newPass, setNewPass] = useState('');
  const [planId, setPlanId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setEditForm({ name: student.name || '', zoom_link: student.zoom_link || '', weak_areas: Array.isArray(student.weak_areas) ? student.weak_areas.join(', ') : (student.weak_areas || '') });
      setPlanId(student.plan_id || '');
    }
  }, [student]);

  if (!student) return null;

  const save = async () => {
    setSaving(true);
    try {
      await studentsAPI.update(student.id, { ...editForm, weak_areas: editForm.weak_areas.split(',').map(s => s.trim()).filter(Boolean) });
      if (planId && planId !== student.plan_id) {
        await studentsAPI.update(student.id, { plan_id: parseInt(planId) });
      }
      success('Student updated!');
      onSaved();
    } catch (e) { notifyError(e.message); }
    finally { setSaving(false); }
  };

  const resetPassword = async () => {
    if (!newPass || newPass.length < 6) { notifyError('Min 6 characters'); return; }
    setSaving(true);
    try {
      await studentsAPI.resetPassword(student.id, newPass);
      success('Password reset!');
      setNewPass('');
    } catch (e) { notifyError(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  const tabs = ['info', 'plan', 'password'];

  return (
    <Modal open={open} onClose={onClose} title={`👤 ${student.name}`}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {tab === 'info' && <Button onClick={save} loading={saving}>Save Changes</Button>}
        {tab === 'password' && <Button onClick={resetPassword} loading={saving}>Reset Password</Button>}
      </>}
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            background: tab === t ? 'var(--accent)' : 'var(--bg3)', color: tab === t ? '#fff' : 'var(--muted)',
            border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, padding: 14, background: 'var(--bg3)', borderRadius: 12, marginBottom: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{student.name?.[0]}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{student.email}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Joined · Score: {student.score || 0} · Streak: {student.streak || 0}🔥</div>
            </div>
          </div>
          <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Full Name</label><input style={inp} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Zoom / Jitsi Link</label><input style={inp} value={editForm.zoom_link} onChange={e => setEditForm(f => ({ ...f, zoom_link: e.target.value }))} placeholder="https://meet.jit.si/room" /></div>
          <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Weak Areas (comma-separated)</label><input style={inp} value={editForm.weak_areas} onChange={e => setEditForm(f => ({ ...f, weak_areas: e.target.value }))} placeholder="grammar, speaking, writing" /></div>
        </div>
      )}

      {tab === 'plan' && (
        <div>
          <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--muted)' }}>Current plan ID: <strong>{student.plan_id || 'None'}</strong></div>
          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Assign Plan</label>
          <select style={inp} value={planId} onChange={e => setPlanId(e.target.value)}>
            <option value="">— No Plan —</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.duration_days}d)</option>)}
          </select>
          <Button style={{ marginTop: 14 }} onClick={save} loading={saving}>Save Plan Assignment</Button>
        </div>
      )}

      {tab === 'password' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>Set a new password for {student.name}. Minimum 6 characters.</p>
          <input type="password" style={inp} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" />
        </div>
      )}
    </Modal>
  );
}

export default function AdminStudents() {
  const { success, error: notifyError } = useNotification();
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([studentsAPI.getAll(), plansAPI.getAll()])
      .then(([s, p]) => { setStudents(s || []); setPlans(p || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const createStudent = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    try {
      await studentsAPI.create(form);
      success('Student created!');
      setCreateOpen(false);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (e) { notifyError(e.message || 'Failed to create student'); }
    finally { setSaving(false); }
  };

  const deleteStudent = async (id) => {
    try {
      await studentsAPI.delete(id);
      success('Student removed.');
      load();
    } catch (e) { notifyError(e.message || 'Failed to delete student'); }
  };

  const inp = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }} className="fade-up">
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700 }}>Students 👥</div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Add Student</Button>
      </div>

      <Card className="fade-up-2" style={{ marginBottom: 16, padding: '10px 14px' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name or email…" style={{ ...inp, background: 'transparent', border: 'none' }} />
      </Card>

      {loading ? <SkeletonList count={6} cardHeight={70} /> : filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No students found.
        </Card>
      ) : filtered.map((s) => (
        <Card key={s.id} className="fade-up-3" style={{ marginBottom: 10, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>
              {s.name?.[0] || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {s.score > 0 && <Badge label={`${s.score} pts`} color="gold" size="xs" />}
              {s.streak > 0 && <Badge label={`${s.streak}🔥`} color="warn" size="xs" />}
              <Button size="xs" variant="ghost" onClick={() => setDeleteTarget(s)}>Remove</Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Student"
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={createStudent} loading={saving} disabled={!form.name || !form.email || !form.password}>Create</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['name', 'email', 'password'].map((f) => (
            <div key={f}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, fontWeight: 500, textTransform: 'capitalize' }}>{f}</label>
              <input type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'}
                value={form[f]} onChange={(e) => setForm((c) => ({ ...c, [f]: e.target.value }))}
                style={inp} placeholder={f === 'name' ? 'Full Name' : f === 'email' ? 'email@example.com' : 'Secure password'} />
            </div>
          ))}
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteStudent(deleteTarget?.id)}
        title="Remove Student"
        message={`Are you sure you want to remove ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
