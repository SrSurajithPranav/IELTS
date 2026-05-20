import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/api';

function Card({ children, onClick, style }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--card)', padding: 12, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.05)', ...style }}>
      {children}
    </div>
  );
}

export default function VocabularyPage() {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState({ word: '', definition: '', example: '' });
  const [flipIndex, setFlipIndex] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiCall('/vocabulary/');
        setWords(res || []);
      } catch (e) {}
    })();
  }, []);

  const addWord = async () => {
    try {
      const res = await apiCall('/vocabulary/', { method: 'POST', body: JSON.stringify(newWord) });
      setWords((w) => [res, ...w]);
      setNewWord({ word: '', definition: '', example: '' });
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  const toggleMastered = async (id, mastered) => {
    try {
      await apiCall(`/vocabulary/${id}`, { method: 'PATCH', body: JSON.stringify({ mastered: !mastered }) });
      setWords((w) => w.map(x => x.id === id ? { ...x, mastered: !mastered } : x));
    } catch (e) {}
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>📓 Vocabulary Notebook</h2>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {words.map((w, idx) => (
          <Card key={w.id} onClick={() => setFlipIndex(flipIndex === idx ? null : idx)}>
            {flipIndex === idx ? (
              <div>
                <div><strong>Definition:</strong> {w.definition}</div>
                <div style={{ marginTop: 8 }}><strong>Example:</strong> {w.example}</div>
              </div>
            ) : (
              <div>
                <h4 style={{ marginBottom: 8 }}>{w.word}</h4>
                <button onClick={(e) => { e.stopPropagation(); toggleMastered(w.id, w.mastered); }}>{w.mastered ? '✓ Mastered' : 'Mark as mastered'}</button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <Card>
          <h4>Add new word</h4>
          <input placeholder="Word" value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} />
          <br />
          <textarea placeholder="Definition" value={newWord.definition} onChange={e => setNewWord({...newWord, definition: e.target.value})} />
          <br />
          <textarea placeholder="Example" value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} />
          <br />
          <button onClick={addWord}>Save</button>
        </Card>
      </div>
    </div>
  );
}
