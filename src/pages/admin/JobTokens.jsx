import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function AdminJobTokens() {
  const [tokens, setTokens] = useState([]);
  const [name, setName] = useState('cron');
  const [days, setDays] = useState(7);

  const load = async () => {
    try {
      const res = await adminAPI.listJobTokens();
      setTokens(Array.isArray(res) ? res : []);
    } catch (e) { setTokens([]); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const res = await adminAPI.createJobToken(name, Number(days));
      // Show token only once to admin, do not store plaintext token in UI
      const token = res?.token;
      if (token) {
        // present token in a prompt so admin can copy safely
        // eslint-disable-next-line no-alert
        alert('Token created. Copy it now (will not be stored):\n' + token);
      }
      load();
    } catch (e) { alert('Create failed: ' + (e.message || e)); }
  };

  const remove = async (id) => {
    if (!confirm('Delete token?')) return;
    try { await adminAPI.deleteJobToken(id); load(); } catch (e) { alert('Delete failed'); }
  };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Job Tokens</div>
      <Card>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} style={{ width: 80 }} />
          <Button onClick={create}>Create Token</Button>
        </div>
      </Card>

      <div style={{ marginTop: 12 }}>
        {tokens.length === 0 ? <div style={{ color: 'var(--muted)' }}>No tokens</div> : tokens.map(t => (
          <Card key={t.token} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Expires: {t.expires_at}</div>
              </div>
              <div>
                <Button variant="ghost" onClick={() => { navigator.clipboard?.writeText(t.token); alert('Token copied'); }}>Copy</Button>
                <Button variant="danger" onClick={() => remove(t.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
