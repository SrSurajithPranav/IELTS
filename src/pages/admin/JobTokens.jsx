import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

function formatExpiry(value) {
  if (!value) return 'No expiry';
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

export default function AdminJobTokens() {
  const [tokens, setTokens] = useState([]);
  const [name, setName] = useState('cron');
  const [days, setDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [createdToken, setCreatedToken] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const load = async () => {
    try {
      const res = await adminAPI.listJobTokens();
      setTokens(Array.isArray(res) ? res : []);
    } catch (e) {
      setTokens([]);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    setSaving(true);
    try {
      const res = await adminAPI.createJobToken(name, Number(days));
      setCreatedToken(res?.token || '');
      setShowSecret(true);
      load();
    } catch (e) {
      alert('Create failed: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this token?')) return;
    try {
      await adminAPI.deleteJobToken(id);
      load();
    } catch (e) {
      alert('Delete failed: ' + (e.message || e));
    }
  };

  const secretPreview = useMemo(() => {
    if (!createdToken) return '';
    return `${createdToken.slice(0, 8)}…${createdToken.slice(-6)}`;
  }, [createdToken]);

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(createdToken);
      alert('Token copied');
    } catch {
      alert('Copy failed');
    }
  };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Job Tokens</div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0, 1fr) 120px auto', alignItems: 'center' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" />
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" style={{ width: '100%' }} />
          <Button onClick={onCreate} loading={saving}>Create Token</Button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
          The secret is only shown once after creation. Existing tokens stay masked in the list.
        </div>
      </Card>

      <div style={{ marginTop: 12 }}>
        {tokens.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>No tokens</div>
        ) : tokens.map((t) => (
          <Card key={t.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{t.name || 'Unnamed token'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Expires: {formatExpiry(t.expires_at)} · Created by user #{t.created_by}
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => remove(t.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={showSecret}
        onClose={() => { setShowSecret(false); setCreatedToken(''); }}
        title="Copy Job Token"
        maxWidth={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowSecret(false); setCreatedToken(''); }}>Close</Button>
            <Button onClick={copySecret} disabled={!createdToken}>Copy Secret</Button>
          </>
        }
      >
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
          Copy this token now and store it in your scheduler or secrets manager. It will not be shown again.
        </div>
        <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13 }}>
          {secretPreview || 'No token generated'}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
          The full secret is available through the Copy Secret button only in this dialog.
        </div>
      </Modal>
    </div>
  );
}
