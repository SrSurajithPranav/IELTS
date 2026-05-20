/**
 * Shared UI utilities.
 * Exports:
 *   ToastProvider      - mount once near app root
 *   useToast()         - { success, error, info, warn }
 *   NotificationBell   - optional bell widget for in-app notifications
 *   setupAutoRefresh() - optional refresh-token background job
 */
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { API_BASE_URL } from './services/api';

const ToastCtx = createContext(null);

export const useToast = () => useContext(ToastCtx);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
    warn: (msg) => push(msg, 'warn'),
  };

  const colors = {
    success: { bg: 'rgba(52,211,153,.95)', text: '#052e16' },
    error: { bg: 'rgba(239,68,68,.95)', text: '#fff' },
    info: { bg: 'rgba(91,141,239,.95)', text: '#fff' },
    warn: { bg: 'rgba(251,191,36,.95)', text: '#1c1a08' },
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} style={{
              background: c.bg, color: c.text, padding: '11px 18px',
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,.35)',
              animation: 'fadeUp .3s ease',
              maxWidth: 340, pointerEvents: 'auto',
            }}>
              {t.msg}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
};

const API_BASE = API_BASE_URL;

export const setupAutoRefresh = () => {
  const refresh = async () => {
    const rt = localStorage.getItem('refresh_token');
    if (!rt) return;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${rt}` },
      });
      if (res.ok) {
        const data = await res.json();
        const next = data.access_token || data.token;
        if (next) localStorage.setItem('jwt_token', next);
      }
    } catch {
      // no-op: silent retry on next interval
    }
  };
  const id = setInterval(refresh, 25 * 60 * 1000);
  return () => clearInterval(id);
};

const fetchNotifs = async () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/notifications/unread`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
};

const markAllRead = async () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return;
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
};

export const NotificationBell = () => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    const data = await fetchNotifs();
    setNotifs(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open && notifs.length > 0) {
      markAllRead().then(load);
    }
  };

  const typeColors = { feedback: '#34d399', reminder: '#fbbf24', achievement: '#f4b942', info: '#5b8def' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        position: 'relative', padding: '6px 8px',
      }}>
        <span style={{ fontSize: 18 }}>🔔</span>
        {notifs.length > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--danger, #ef4444)', color: '#fff',
            fontSize: 9, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {notifs.length > 9 ? '9+' : notifs.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', width: 300,
          background: 'var(--card, #13161f)',
          border: '1px solid var(--border, rgba(255,255,255,.07))',
          borderRadius: 12, zIndex: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
            Notifications {notifs.length > 0 && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>({notifs.length})</span>}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              All caught up! No new notifications.
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifs.map((n) => (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  borderLeft: `3px solid ${typeColors[n.type] || '#5b8def'}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
