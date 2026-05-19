import React from 'react';

const COLOR_MAP = {
  accent:  { bg: 'rgba(20,108,114,.12)',  text: 'var(--accent)'  },
  success: { bg: 'var(--success-soft)',   text: 'var(--success)' },
  warn:    { bg: 'var(--warn-soft)',      text: 'var(--warn)'    },
  danger:  { bg: 'var(--danger-soft)',    text: 'var(--danger)'  },
  purple:  { bg: 'var(--purple-soft)',    text: 'var(--purple)'  },
  gold:    { bg: 'var(--gold-soft)',      text: 'var(--gold)'    },
  info:    { bg: 'var(--info-soft)',      text: 'var(--info)'    },
  muted:   { bg: 'rgba(100,115,128,.1)', text: 'var(--muted)'   },
};

export function Badge({ label, color = 'accent', size = 'sm', dot = false, style = {} }) {
  const c = COLOR_MAP[color] || COLOR_MAP.accent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      fontSize: size === 'xs' ? 10 : 11,
      fontWeight: 600,
      padding: size === 'xs' ? '2px 7px' : '3px 10px',
      borderRadius: 99,
      letterSpacing: '.4px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text }} />}
      {label}
    </span>
  );
}

const TYPE_COLORS = {
  speaking: 'accent', writing: 'purple', listening: 'success',
  reading: 'warn', grammar: 'gold', vocabulary: 'info',
};
const STATUS_COLORS = { pending: 'warn', submitted: 'accent', reviewed: 'success' };

export function TaskTypeBadge({ type }) {
  return <Badge label={type} color={TYPE_COLORS[type] || 'accent'} />;
}

export function StatusBadge({ status }) {
  return <Badge label={status} color={STATUS_COLORS[status] || 'muted'} dot />;
}
