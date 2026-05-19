import React, { useState, useEffect } from 'react';
import { announcementsAPI } from '../services/api';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    announcementsAPI.getAll()
      .then((res) => setAnnouncements(Array.isArray(res) ? res : res?.announcements || []))
      .catch(() => setAnnouncements([]));
  }, []);

  const active = announcements.filter((a) => !dismissed.includes(a.id)).slice(0, 2);
  if (active.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
      {active.map((a) => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 16px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-glow)',
          borderRadius: 12,
          fontSize: 13,
          lineHeight: 1.5,
          animation: 'fadeUp 0.4s ease both',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>📢</span>
          <div style={{ flex: 1 }}>
            {a.title && <strong style={{ display: 'block', marginBottom: 2, color: 'var(--accent)' }}>{a.title}</strong>}
            <span style={{ color: 'var(--text)' }}>{a.content || a.message || ''}</span>
          </div>
          <button
            onClick={() => setDismissed((d) => [...d, a.id])}
            style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0,
            }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}
