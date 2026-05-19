import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

export default function AdminStudents() {
  const { success, error: notifyError } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const load = () => studentsAPI.getAll()
    .then((res) => setStudents(res || []))
    .catch(() => setStudents([]))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) =>
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
