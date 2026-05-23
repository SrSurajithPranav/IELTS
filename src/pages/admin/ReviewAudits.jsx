import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ReviewAudits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState('');
  const [student, setStudent] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [questionCount, setQuestionCount] = useState('');

  const buildFilters = () => ({
    creator_id: creator,
    student_id: student,
    category,
    from: fromDate,
    to: toDate,
  });

  const load = async (overrideFilters = buildFilters()) => {
    setLoading(true);
    try {
      const res = await feedbackAPI.getReviewAudits(overrideFilters);
      setAudits(Array.isArray(res) ? res : []);
    } catch (e) {
      setAudits([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportCsv = async () => {
    try {
      const res = await feedbackAPI.exportReviewAuditsCsv(buildFilters());
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
    if (questionCount && Number(a.question_count) < Number(questionCount)) return false;
    return true;
  });

  const applyFilters = () => load(buildFilters());

  const clearFilters = () => {
    setCreator('');
    setStudent('');
    setCategory('');
    setFromDate('');
    setToDate('');
    setQuestionCount('');
    load({});
  };

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
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <input placeholder="Creator user id" value={creator} onChange={(e) => setCreator(e.target.value)} />
          <input placeholder="Student id" value={student} onChange={(e) => setStudent(e.target.value)} />
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <input placeholder="Min questions" type="number" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button variant="ghost" onClick={clearFilters}>Clear</Button>
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
