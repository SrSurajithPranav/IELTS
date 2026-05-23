import { useState, useEffect, useRef } from 'react';

export function DotMenu({ items = [], align = 'right', triggerLabel = '⋮', size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerStyle = {
    background: open ? 'var(--bg3)' : 'transparent',
    border: `1px solid ${open ? 'var(--border)' : 'transparent'}`,
    borderRadius: 8,
    cursor: 'pointer',
    color: 'var(--muted)',
    padding: size === 'sm' ? '3px 7px' : '5px 10px',
    fontSize: size === 'sm' ? 14 : 18,
    lineHeight: 1,
    transition: 'all 150ms',
    fontFamily: 'inherit',
  };

  const menuStyle = {
    position: 'absolute',
    [align === 'right' ? 'right' : 'left']: 0,
    top: 'calc(100% + 4px)',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
    minWidth: 170,
    overflow: 'hidden',
    animation: 'fadeUp .15s ease',
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <button
        style={triggerStyle}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title="More options"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text)';
          e.currentTarget.style.background = 'var(--bg3)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.color = 'var(--muted)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        {triggerLabel}
      </button>

      {open && (
        <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
          {items.map((item, i) => {
            if (item === '---') {
              return <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />;
            }
            return (
              <button
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  cursor: item.disabled ? 'default' : 'pointer',
                  color: item.danger ? 'var(--danger)' : item.disabled ? 'var(--muted2)' : 'var(--text)',
                  fontFamily: 'inherit',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'background 120ms',
                }}
                disabled={item.disabled}
                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                onClick={() => {
                  if (item.disabled) return;
                  item.action?.();
                  setOpen(false);
                }}
              >
                {item.icon && <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    padding: '2px 7px', borderRadius: 99,
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DotMenu;
