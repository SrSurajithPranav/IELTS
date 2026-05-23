import React, { useState, useEffect } from 'react';
import { quizzesAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ReviewAudits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState('');
  const [student, setStudent] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await quizzesAPI.getReviewAudits();
      setAudits(Array.isArray(res) ? res : []);
    } catch (e) {
      setAudits([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportCsv = async () => {
    try {
      const res = await quizzesAPI.exportReviewAuditsCsv();
      if (typeof res === 'string') {
        const blob = new Blob([res], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'review_audits.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        return;
      }
      // fallback build CSV
      const rows = audits;
      if (!rows || rows.length === 0) return;
      const header = Object.keys(rows[0]);
      const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'review_audits.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + (e.message || e)); }
  };

  const filtered = audits.filter(a => {
    if (creator && String(a.creator_id) !== String(creator)) return false;
    if (student && String(a.student_id) !== String(student)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Review Audits</div>
        <div>
          <Button variant="ghost" onClick={load}>Refresh</Button>
          <Button onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Creator user id" value={creator} onChange={(e) => setCreator(e.target.value)} />
          <input placeholder="Student id" value={student} onChange={(e) => setStudent(e.target.value)} />
          <Button onClick={() => {}}>Apply</Button>
        </div>
      </Card>

      <div>
        {loading ? <div style={{ color: 'var(--muted)' }}>Loading…</div> : (
          filtered.length === 0 ? <div style={{ color: 'var(--muted)' }}>No audits found.</div> : filtered.map(a => (
            <Card key={a.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Quiz {a.quiz_id} — Student {a.student_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Questions: {a.question_count} · By: {a.creator_id} · On: {new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
