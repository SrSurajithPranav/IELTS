import React from 'react';

export function ProgressRing({ pct = 0, size = 80, stroke = 7, color = 'var(--accent)', label = null, showPct = true }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--border)" strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Label */}
      {showPct && (
        <text
          x="50%" y="50%"
          textAnchor="middle"
          dy="0.35em"
          fill={color}
          fontSize={size / 4.5}
          fontWeight={700}
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fontFamily: 'Manrope, sans-serif' }}
        >
          {label ?? `${Math.round(pct)}%`}
        </text>
      )}
    </svg>
  );
}

export function ProgressBar({ pct = 0, color = 'var(--accent)', height = 6, animated = true, style = {} }) {
  return (
    <div style={{
      background: 'var(--border)', borderRadius: 99, height,
      overflow: 'hidden', ...style,
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: color,
        height: '100%',
        borderRadius: 99,
        transition: animated ? 'width 0.8s cubic-bezier(0.4,0,0.2,1)' : undefined,
      }} />
    </div>
  );
}

export function MultiProgressBar({ segments = [], height = 8 }) {
  // segments: [{ label, pct, color }]
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, height, overflow: 'hidden', display: 'flex' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          width: `${Math.min(100, Math.max(0, seg.pct))}%`,
          background: seg.color || 'var(--accent)',
          height: '100%',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} title={seg.label} />
      ))}
    </div>
  );
}
