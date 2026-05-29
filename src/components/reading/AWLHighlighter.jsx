import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function AWLHighlighter() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const highlightAWL = async () => {
    if (!text || text.trim().length < 50) {
      setError('Please paste at least 50 characters');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reading/awl-highlight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passage: text })
      });

      if (!response.ok) throw new Error('Failed to analyze');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWord = (word) => {
    navigator.clipboard.writeText(word);
    alert(`Copied: ${word}`);
  };

  return (
    <Card>
      <h4>📖 Academic Word List (AWL) Highlighter</h4>
      <p>Identify and learn Academic Word List words in any IELTS reading passage.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Paste an IELTS reading passage here..."
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          borderRadius: '6px',
          border: '1px solid #ddd',
          marginBottom: '1rem'
        }}
      />

      <Button onClick={highlightAWL} loading={loading} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Highlight AWL Words'}
      </Button>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee', borderRadius: '6px', color: '#c33' }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>AWL Words Found</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{analysis.total_awl_words}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>Coverage</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {Math.round((analysis.total_awl_words / text.split(/\s+/).length) * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#fff9c4',
            borderRadius: '6px',
            marginBottom: '1rem',
            lineHeight: '1.8',
            fontSize: '0.95rem'
          }}>
            <div dangerouslySetInnerHTML={{
              __html: analysis.highlighted_passage
                .replace(/<mark[^>]*>/g, '<mark style="background: #ffd54f; padding: 2px 4px; cursor: pointer; border-radius: 3px;">')
                .replace(/<\/mark>/g, '</mark>')
            }}
            onClick={(e) => {
              if (e.target.tagName === 'MARK') {
                const word = e.target.textContent;
                setSelectedWord({ word: word.trim(), definition: analysis.definitions[word.toLowerCase().trim()] });
              }
            }}
            style={{ cursor: 'pointer' }}
            />
          </div>

          {selectedWord && (
            <div style={{
              padding: '1rem',
              background: '#e3f2fd',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#1976d2', marginBottom: '0.25rem' }}>Word</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1565c0' }}>
                    {selectedWord.word}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedWord(null)}
                >
                  ✕
                </Button>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Definition</div>
                <div style={{ fontSize: '0.95rem', color: '#333' }}>
                  {selectedWord.definition || 'No definition available'}
                </div>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleCopyWord(selectedWord.word)}
                style={{ marginTop: '0.75rem' }}
              >
                Copy Word
              </Button>
            </div>
          )}

          {analysis.awl_words_found.length > 0 && !selectedWord && (
            <div>
              <h5 style={{ marginBottom: '0.5rem' }}>AWL Words Found:</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {analysis.awl_words_found.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWord({ 
                      word, 
                      definition: analysis.definitions[word] 
                    })}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ffd54f',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#ffca28'}
                    onMouseLeave={(e) => e.target.style.background = '#ffd54f'}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        mark {
          cursor: pointer;
          transition: background 0.2s;
        }
        mark:hover {
          background: #ffca28 !important;
        }
      `}</style>
    </Card>
  );
}
