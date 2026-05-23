import React, { useState, useEffect } from 'react';
import { notificationsAPI, API_BASE_URL } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getMy();
      setNotes(Array.isArray(res) ? res : []);
    } catch (e) {
      setNotes([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (open) load(); }, [open]);

  // Live updates via Server-Sent Events
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;
    const url = `${API_BASE_URL}/notifications/stream?access_token=${token}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setNotes((prev) => [data].concat(prev));
      } catch (err) {
        // ignore
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotes(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (e) {}
  };

  const unread = notes.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -6, background: 'var(--danger)', color: '#fff', borderRadius: 99, padding: '2px 6px', fontSize: 11 }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, width: 360, zIndex: 9999 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Notifications</div>
              <div>
                <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {loading ? <div style={{ color: 'var(--muted)' }}>Loading…</div> : (
                notes.length === 0 ? <div style={{ color: 'var(--muted)' }}>No notifications</div> : notes.map(n => (
                  <div key={n.id} style={{ padding: 10, background: n.read ? 'transparent' : 'var(--bg3)', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{n.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{n.body}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      {!n.read && <Button size="sm" onClick={() => markRead(n.id)}>Mark read</Button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
