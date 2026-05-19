import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { SkeletonList } from '../../components/ui/Skeleton';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    leaderboardAPI.get(filter)
      .then((res) => setEntries(Array.isArray(res) ? res : res?.leaderboard || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const myRank = entries.findIndex((e) => e.student_id === user?.id || e.id === user?.id);

  return (
    <div>
      <div className="fade-up" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Leaderboard 🏆
      </div>
      <p className="fade-up-2" style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 13 }}>
        Rankings updated daily based on submissions and review scores.
      </p>

      {/* Filter */}
      <div className="fade-up-3" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'week', 'month'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            style={{
              padding: '7px 16px', borderRadius: 99, border: `1.5px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              background: filter === f ? 'var(--accent-soft)' : 'transparent',
              color: filter === f ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All Time' : `This ${f[0].toUpperCase() + f.slice(1)}`}
          </button>
        ))}
      </div>

      {/* My rank */}
      {myRank >= 0 && (
        <Card className="fade-up-4" style={{ marginBottom: 16, background: 'var(--accent-soft)', border: '1.5px solid var(--accent-glow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16,
            }}>
              #{myRank + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Your Rank</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {entries[myRank]?.score || 0} points
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Board */}
      {loading ? (
        <SkeletonList count={8} cardHeight={60} />
      ) : entries.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No data yet. Start submitting tasks to appear on the board!
        </Card>
      ) : (
        entries.slice(0, 20).map((entry, i) => {
          const isMe = entry.student_id === user?.id || entry.id === user?.id;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 12, marginBottom: 8,
              background: isMe ? 'var(--accent-soft)' : i % 2 === 0 ? 'var(--bg2)' : 'var(--card)',
              border: `1px solid ${isMe ? 'var(--accent-glow)' : 'var(--border)'}`,
              transition: 'all 180ms',
            }}>
              <div style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                background: i < 3 ? 'var(--gold-soft)' : 'var(--bg3)',
                fontSize: i < 3 ? 18 : 14,
                fontWeight: 800, color: i < 3 ? 'var(--gold)' : 'var(--muted)',
                flexShrink: 0,
              }}>
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                  {entry.name} {isMe && <span style={{ color: 'var(--accent)', fontSize: 11 }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
                  {entry.streak || 0}🔥 streak
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>{entry.score ?? entry.score_total ?? 0}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>pts</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
