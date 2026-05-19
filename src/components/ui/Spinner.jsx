import React from 'react';

export function Spinner({ size = 22, color = 'var(--accent)', style = {} }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size / 8)}px solid rgba(0,0,0,0.1)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function PageSpinner({ message = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: '80px 20px',
      color: 'var(--muted)', fontSize: 14,
    }}>
      <Spinner size={36} />
      {message && <span>{message}</span>}
    </div>
  );
}
