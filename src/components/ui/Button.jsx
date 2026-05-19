import React from 'react';
import { Spinner } from './Spinner';

const VARIANTS = {
  primary: {
    background: 'var(--accent)', color: 'var(--on-accent)',
    boxShadow: '0 4px 14px var(--accent-glow)',
  },
  secondary: {
    background: 'var(--accent2)', color: 'var(--on-accent)',
  },
  outline: {
    background: 'transparent', color: 'var(--accent)',
    border: '1.5px solid var(--accent)',
  },
  ghost: {
    background: 'transparent', color: 'var(--muted)',
    border: '1.5px solid transparent',
  },
  danger: { background: 'var(--danger)', color: '#fff' },
  success: { background: 'var(--success)', color: '#fff' },
  gold: { background: 'var(--gold)', color: '#fff' },
  purple: { background: 'var(--purple)', color: '#fff' },
  soft: {
    background: 'var(--accent-soft)', color: 'var(--accent)',
    border: '1px solid var(--accent-glow)',
  },
};

const SIZES = {
  xs: { padding: '4px 10px', fontSize: 11, borderRadius: 7 },
  sm: { padding: '7px 14px', fontSize: 12, borderRadius: 8 },
  md: { padding: '10px 20px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '13px 28px', fontSize: 15, borderRadius: 12 },
  xl: { padding: '16px 36px', fontSize: 16, borderRadius: 14 },
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconRight = null,
  style = {},
  type = 'button',
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'inherit',
        fontWeight: 600,
        letterSpacing: '.2px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: 'none',
        outline: 'none',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        ...v,
        ...s,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.filter = 'brightness(1.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = '';
        e.currentTarget.style.transform = '';
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {loading ? (
        <Spinner size={size === 'xs' || size === 'sm' ? 14 : 18} color="currentColor" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

// Alias for backward compatibility
export default Button;
export { Button as Btn };
