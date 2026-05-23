import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const STUDENT_NAV = [
  { id: 'dashboard',   icon: '⊞',  label: 'Dashboard',    group: 'main' },
  { id: 'tasks',       icon: '✓',  label: "Today's Tasks", group: 'main' },
  { id: 'progress',    icon: '📊', label: 'Progress',      group: 'main' },
  { id: 'plans',       icon: '💼', label: 'Plans',         group: 'learn' },
  { id: 'speaking',    icon: '🎧', label: 'Speaking',      group: 'learn' },
  { id: 'writing',     icon: '✍️', label: 'Writing',       group: 'learn' },
  { id: 'vocabulary',  icon: '📓', label: 'Vocabulary',    group: 'learn' },
  { id: 'debate',      icon: '🗣️', label: 'Debate Mode',   group: 'learn' },
  { id: 'mocktest',    icon: '⏱',  label: 'Mock Test',     group: 'practice' },
  { id: 'games',       icon: '🧩', label: 'Games Arena',   group: 'practice' },
  { id: 'quizzes',     icon: '❓', label: 'Quizzes',       group: 'practice' },
  { id: 'leaderboard', icon: '🏆', label: 'Leaderboard',   group: 'social' },
  { id: 'liveclass',   icon: '🎥', label: 'Live Sessions', group: 'social' },
  { id: 'resources',   icon: '📚', label: 'Resources',     group: 'social' },
];

const ADMIN_NAV = [
  { id: 'admin-home',      icon: '⊞',  label: 'Overview',     group: 'main' },
  { id: 'admin-students',  icon: '👥', label: 'Students',     group: 'main' },
  { id: 'admin-review',    icon: '🔍', label: 'Review',       group: 'main' },
  { id: 'admin-audits',    icon: '📜', label: 'Audits',       group: 'main' },
  { id: 'admin-plans',     icon: '📋', label: 'Plans',        group: 'manage' },
  { id: 'admin-tasks',     icon: '✓',  label: 'Tasks',        group: 'manage' },
  { id: 'admin-sessions',  icon: '🎙', label: 'Sessions',     group: 'manage' },
  { id: 'admin-resources', icon: '📚', label: 'Resources',    group: 'manage' },
  { id: 'admin-job-tokens',icon: '🔐', label: 'Job Tokens',   group: 'manage' },
  { id: 'admin-quizzes',   icon: '🧩', label: 'Quiz Builder', group: 'manage' },
];

const GROUP_LABELS = {
  main: null,
  learn: 'Learning',
  practice: 'Practice',
  social: 'Community',
  manage: 'Management',
};

function NavItem({ item, active, onClick }) {
  return (
    <motion.button
      onClick={() => onClick(item.id)}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        border: active ? '1px solid var(--accent-glow)' : '1px solid transparent',
        marginBottom: 1,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'background 150ms, color 150ms',
        position: 'relative',
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-indicator"
          style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3, background: 'var(--accent)', borderRadius: '0 3px 3px 0',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </motion.button>
  );
}

export function Sidebar({ page, setPage, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const nav = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;

  // Group nav items
  const groups = nav.reduce((acc, item) => {
    const g = item.group || 'main';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const firstLetter = user?.name?.[0] || '?';
  const quickMeetUrl = user?.zoom_link || `https://meet.jit.si/ielts-${user?.id}-session`;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`app-sidebar${isOpen ? ' open' : ''}`}
        style={{
          width: 250,
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 16,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700,
                color: 'var(--accent)', letterSpacing: '.5px',
              }}>
                IELTS<span style={{ color: 'var(--gold)' }}>Pro</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, fontWeight: 500, letterSpacing: '.6px', textTransform: 'uppercase' }}>
                AI Learning Platform
              </div>
            </div>
            {/* Close on mobile */}
            <button
              onClick={onClose}
              style={{
                display: 'none', background: 'none', color: 'var(--muted)',
                fontSize: 18, padding: 4, cursor: 'pointer',
              }}
              className="sidebar-close-btn"
            >✕</button>
          </div>
        </div>

        {/* User chip */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
              boxShadow: '0 4px 10px var(--accent-glow)',
            }}>
              {firstLetter}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }} className="truncate">
                {user?.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {user?.role === 'admin' ? '👩‍🏫 Teacher' : '📚 Student'}
              </div>
            </div>
          </div>

          {/* Streak pill */}
          {user?.role === 'student' && user.streak > 0 && (
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--gold-soft)', borderRadius: 8,
              padding: '6px 10px', border: '1px solid rgba(214,148,41,.2)',
            }}>
              <span style={{ animation: 'streak-flame 1.2s ease-in-out infinite', fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                {user.streak} day streak
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {Object.entries(groups).map(([groupKey, items]) => (
            <div key={groupKey} style={{ marginBottom: 8 }}>
              {GROUP_LABELS[groupKey] && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--muted2)',
                  letterSpacing: '.8px', textTransform: 'uppercase',
                  padding: '8px 12px 4px',
                }}>
                  {GROUP_LABELS[groupKey]}
                </div>
              )}
              {items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={page === item.id}
                  onClick={(id) => { setPage(id); onClose?.(); }}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
          {/* Quick Meet */}
          <a href={quickMeetUrl} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}>
            <motion.div whileHover={{ x: 3 }} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 10, color: 'var(--accent)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 15 }}>🎥</span> Quick Meet
            </motion.div>
          </a>

          {/* Logout */}
          <motion.button
            whileHover={{ x: 3 }}
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, background: 'transparent',
              color: 'var(--muted)', fontSize: 13, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <span style={{ fontSize: 15 }}>⎋</span> Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
}
