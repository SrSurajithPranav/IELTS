import React, { useEffect, useState } from 'react';
import { vocabularyAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function VocabularyPage() {
  const [words, setWords]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [flipIndex, setFlipIndex] = useState(null);
  const [newWord, setNewWord]     = useState({ word: '', definition: '', example: '' });
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => {
    vocabularyAPI.getAll()
      .then((res) => setWords(res || []))
      .catch(() => setWords([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setError(''); setSuccess('');
    if (!newWord.word.trim())       { setError('Word is required.'); return; }
    if (!newWord.definition.trim()) { setError('Definition is required.'); return; }
    if (newWord.word.trim().length > 100)       { setError('Word must be under 100 characters.'); return; }
    if (newWord.definition.trim().length > 300) { setError('Definition must be under 300 characters.'); return; }
    setAdding(true);
    try {
      const res = await vocabularyAPI.add(newWord);
      setWords((w) => [res, ...w]);
      setNewWord({ word: '', definition: '', example: '' });
      setSuccess('Word added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save. Check your connection and try again.');
    } finally {
      setAdding(false);
    }
  };

  const toggleMastered = async (id, mastered) => {
    try {
      await vocabularyAPI.update(id, { mastered: !mastered });
      setWords((w) => w.map((x) => (x.id === id ? { ...x, mastered: !mastered } : x)));
    } catch { /* silent – not critical */ }
  };

  const deleteWord = async (id) => {
    try {
      await vocabularyAPI.delete(id);
      setWords((w) => w.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete.');
    }
  };

  const mastered  = words.filter((w) => w.mastered).length;
  const remaining = words.length - mastered;

  return (
    <div>
      <div className="fade-up playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        📓 Vocabulary Notebook
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        {words.length} words · {mastered} mastered · {remaining} to go
      </div>

      {/* Add word form */}
      <Card className="fade-up-2" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Add a New Word</div>
        <input
          value={newWord.word}
          onChange={(e) => setNewWord((n) => ({ ...n, word: e.target.value }))}
          placeholder="Word or phrase"
          maxLength={100}
          style={inputStyle}
        />
        <input
          value={newWord.definition}
          onChange={(e) => setNewWord((n) => ({ ...n, definition: e.target.value }))}
          placeholder="Definition"
          maxLength={300}
          style={inputStyle}
        />
        <input
          value={newWord.example}
          onChange={(e) => setNewWord((n) => ({ ...n, example: e.target.value }))}
          placeholder="Example sentence (optional)"
          maxLength={400}
          style={inputStyle}
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10, padding: '8px 12px', background: 'rgba(220,53,69,.08)', borderRadius: 8 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 10, padding: '8px 12px', background: 'rgba(40,167,69,.08)', borderRadius: 8 }}>
            ✅ {success}
          </div>
        )}
        <Button onClick={handleAdd} loading={adding} size="sm">Save Word</Button>
      </Card>

      {/* Word list */}
      {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}
      {!loading && words.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>No words yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Add your first word above to start building your IELTS vocabulary.
          </div>
        </Card>
      )}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {words.map((w, idx) => (
          <Card
            key={w.id}
            onClick={() => setFlipIndex(flipIndex === idx ? null : idx)}
            style={{
              cursor: 'pointer',
              border: w.mastered ? '1.5px solid var(--success)' : '1px solid var(--border)',
              minHeight: 100,
            }}
          >
            {flipIndex === idx ? (
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Definition</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{w.definition}</div>
                {w.example && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>"{w.example}"</div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{w.word}</div>
                {w.mastered && <Badge label="Mastered ✓" color="success" />}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Tap to see definition</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant={w.mastered ? 'outline' : 'success'}
                onClick={() => toggleMastered(w.id, w.mastered)} style={{ flex: 1, fontSize: 11 }}>
                {w.mastered ? 'Unmark' : '✓ Mastered'}
              </Button>
              <Button size="sm" variant="danger" onClick={() => deleteWord(w.id)} style={{ fontSize: 11 }}>✕</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', marginBottom: 10,
  background: 'var(--input-bg, var(--card))', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
};
