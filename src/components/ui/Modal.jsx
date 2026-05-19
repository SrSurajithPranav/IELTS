import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Modal({ open, onClose, title, children, maxWidth = 540, footer }) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                width: '100%',
                maxWidth,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || onClose) && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', borderBottom: '1px solid var(--border)',
                  flexShrink: 0,
                }}>
                  {title && (
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700 }}>
                      {title}
                    </div>
                  )}
                  {onClose && (
                    <button onClick={onClose} style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 8, width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--muted)', fontSize: 16, cursor: 'pointer',
                      transition: 'all 150ms',
                      marginLeft: 'auto',
                    }}>✕</button>
                  )}
                </div>
              )}

              {/* Body */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div style={{
                  padding: '16px 24px', borderTop: '1px solid var(--border)',
                  display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
                }}>
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={400}
      footer={
        <>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 9, background: 'var(--bg3)',
            border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={() => { onConfirm?.(); onClose?.(); }} style={{
            padding: '9px 18px', borderRadius: 9,
            background: danger ? 'var(--danger)' : 'var(--accent)',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            border: 'none', fontFamily: 'inherit',
          }}>{confirmLabel}</button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
