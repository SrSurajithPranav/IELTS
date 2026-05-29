import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function DictationDrill() {
  const [current, setCurrent] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNew = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/listening/dictation/generate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const res = await response.json();
      setCurrent(res);
      setAnswer('');
      setResult(null);
      setTotal(total + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!answer.trim()) {
      setResult({ correct: false, feedback: 'Please provide an answer' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/listening/dictation/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer, correct: current.correct_answer })
      });
      if (!response.ok) throw new Error('Failed to check');
      const res = await response.json();
      setResult(res);
      if (res.correct) {
        setScore(score + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!current) {
      fetchNew();
    }
  }, []);

  if (!current || loading) {
    return (
      <Card>
        <h4>🎧 Number & Letter Dictation Drill</h4>
        <p>Loading...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h4>🎧 Number & Letter Dictation Drill</h4>
      
      <div style={{
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: '6px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Score</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
          {score}/{total > 0 ? total : 0}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
          Type: <strong>{current.type.toUpperCase()}</strong>
        </div>
      </div>

      <div style={{
        padding: '1rem',
        background: '#e3f2fd',
        borderRadius: '6px',
        marginBottom: '1rem',
        fontFamily: 'monospace',
        fontSize: '1.1rem',
        textAlign: 'center'
      }}>
        🔊 {current.audio_text}
      </div>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type what you hear..."
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid #ddd',
          marginBottom: '1rem'
        }}
        onKeyPress={(e) => e.key === 'Enter' && !result && checkAnswer()}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <Button onClick={checkAnswer} disabled={result !== null}>
          Check Answer
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setAnswer('');
            fetchNew();
          }}
          disabled={result === null}
        >
          Next
        </Button>
      </div>

      {result && (
        <div style={{
          padding: '1rem',
          background: result.correct ? '#e8f5e9' : '#ffebee',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <div style={{
            color: result.correct ? '#2e7d32' : '#c62828',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {result.correct ? '✅ Correct!' : '❌ Incorrect'}
          </div>
          <div style={{ fontSize: '0.95rem' }}>
            {result.feedback}
          </div>
        </div>
      )}
    </Card>
  );
}
