import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const STUDENT_BOTTOM_NAV = [
  { id: 'dashboard',  icon: '⊞', label: 'Home' },
  { id: 'tasks',      icon: '✓', label: 'Tasks' },
  { id: 'speaking',   icon: '🎧', label: 'Speak' },
  { id: 'progress',   icon: '📊', label: 'Progress' },
  { id: 'leaderboard',icon: '🏆', label: 'Board' },
];

const ADMIN_BOTTOM_NAV = [
  { id: 'admin-home',     icon: '⊞', label: 'Home' },
  { id: 'admin-students', icon: '👥', label: 'Students' },
  { id: 'admin-review',   icon: '🔍', label: 'Review' },
  { id: 'admin-tasks',    icon: '✓',  label: 'Tasks' },
  { id: 'admin-plans',    icon: '📋', label: 'Plans' },
];

export function MobileNav({ page, setPage }) {
  const { user } = useAuth();
  const nav = user?.role === 'admin' ? ADMIN_BOTTOM_NAV : STUDENT_BOTTOM_NAV;

  return (
    <nav className="bottom-nav" style={{
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      {nav.map((item) => {
        const active = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent)' : 'var(--muted)',
              transition: 'color 150ms',
            }}
          >
            <span style={{
              fontSize: 20,
              filter: active ? 'none' : 'grayscale(0.4)',
              transition: 'all 150ms',
              transform: active ? 'scale(1.15)' : 'scale(1)',
            }}>
              {item.icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>
              {item.label}
            </span>
            {active && (
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: 'var(--accent)',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
