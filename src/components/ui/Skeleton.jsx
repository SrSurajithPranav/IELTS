import React from 'react';

export function Skeleton({ width = '100%', height = 18, radius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, lastWidth = '60%', gap = 10 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastWidth : '100%'}
          height={14}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120, style = {} }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 20, ...style,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
        <Skeleton width={40} height={40} radius={10} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={height - 100} radius={8} />
    </div>
  );
}

export function SkeletonList({ count = 4, cardHeight = 80 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4, minWidth = 240, cardHeight = 120 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
      gap: 14,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </div>
  );
}
