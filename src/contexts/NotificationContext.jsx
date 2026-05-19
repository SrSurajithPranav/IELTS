import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContext = createContext(null);

let idCounter = 0;

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
const COLORS = {
  success: { bg: 'var(--success-soft)', border: 'var(--success)', text: 'var(--success)' },
  error:   { bg: 'var(--danger-soft)',  border: 'var(--danger)',  text: 'var(--danger)'  },
  warning: { bg: 'var(--warn-soft)',    border: 'var(--warn)',    text: 'var(--warn)'    },
  info:    { bg: 'var(--info-soft)',    border: 'var(--accent)',  text: 'var(--accent)'  },
};

function Toast({ id, type, message, onClose }) {
  const c = COLORS[type] || COLORS.info;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        minWidth: 280, maxWidth: 380,
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'all',
      }}
    >
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: c.border, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {ICONS[type]}
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
        {message}
      </span>
      <button onClick={() => onClose(id)} style={{
        background: 'none', border: 'none', color: 'var(--muted)',
        fontSize: 16, cursor: 'pointer', padding: 2, flexShrink: 0,
      }}>✕</button>
    </motion.div>
  );
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((msg, dur) => notify(msg, 'success', dur), [notify]);
  const error   = useCallback((msg, dur) => notify(msg, 'error', dur), [notify]);
  const warning = useCallback((msg, dur) => notify(msg, 'warning', dur), [notify]);
  const info    = useCallback((msg, dur) => notify(msg, 'info', dur), [notify]);

  return (
    <NotificationContext.Provider value={{ notify, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onClose={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider');
  return ctx;
};
