import React from 'react';
import { motion } from 'framer-motion';

export function Card({
  children,
  style = {},
  className = '',
  hover = false,
  glass = false,
  accent = null, // border accent color
  onClick,
  animate = true,
}) {
  const base = {
    background: glass ? 'var(--bg-glass)' : 'var(--card)',
    backdropFilter: glass ? 'blur(20px)' : undefined,
    WebkitBackdropFilter: glass ? 'blur(20px)' : undefined,
    border: accent ? `1.5px solid ${accent}` : '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 24,
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };

  const hoverStyle = hover ? {
    whileHover: { y: -2, boxShadow: 'var(--shadow-lg)' },
    whileTap: { scale: 0.99 },
  } : {};

  if (animate && hover) {
    return (
      <motion.div
        className={className}
        style={base}
        onClick={onClick}
        {...hoverStyle}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={className}
      style={base}
      onClick={onClick}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      } : undefined}
    >
      {children}
    </div>
  );
}

export function GlassCard({ children, style = {}, className = '', ...props }) {
  return (
    <Card glass className={className} style={style} {...props}>
      {children}
    </Card>
  );
}

export function StatCard({ label, value, icon, color = 'var(--accent)', change, style = {} }) {
  return (
    <Card hover style={{ padding: '20px 22px', textAlign: 'center', ...style }}>
      {icon && <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {change != null && (
        <div style={{
          fontSize: 11, marginTop: 6, fontWeight: 600,
          color: change >= 0 ? 'var(--success)' : 'var(--danger)',
        }}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </Card>
  );
}
