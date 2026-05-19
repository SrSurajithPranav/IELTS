import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

const PAGE_TITLES = {
  dashboard: 'Dashboard', tasks: "Today's Tasks", speaking: 'Speaking',
  writing: 'Writing', debate: 'Debate Mode', progress: 'Progress',
  plans: 'Training Plans', games: 'Games Arena', mocktest: 'Mock Test',
  leaderboard: 'Leaderboard', liveclass: 'Live Sessions', quizzes: 'Quizzes',
  resources: 'Resources', vocabulary: 'Vocabulary',
  'admin-home': 'Overview', 'admin-students': 'Students',
  'admin-plans': 'Plans', 'admin-tasks': 'Task Editor',
  'admin-review': 'Review Submissions', 'admin-sessions': 'Sessions',
  'admin-resources': 'Resources', 'admin-quizzes': 'Quiz Builder',
};

export function PageLayout({ page, setPage, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        page={page}
        setPage={setPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        {/* Mobile Header */}
        <div style={{
          display: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          alignItems: 'center',
          gap: 12,
        }} className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 9, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, cursor: 'pointer', color: 'var(--text)',
            }}
          >
            ☰
          </button>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
            IELTS<span style={{ color: 'var(--gold)' }}>Pro</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {PAGE_TITLES[page] || 'IELTSPro'}
          </div>
        </div>

        {/* Page Content */}
        <div className="app-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <MobileNav page={page} setPage={setPage} />
      </div>

      {/* Mobile header CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
