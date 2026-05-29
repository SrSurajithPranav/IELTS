import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function NGFalseDrill() {
  const [drill, setDrill] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadDrill = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/listening/ng-false-drill`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const res = await response.json();
      setDrill(res);
      setAnswer('');
      setFeedback(null);
      setTotal(total + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!answer) {
      setFeedback({ correct: false, explanation: 'Please select an answer' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reading/ng-false-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer, correct: drill.answer })
      });
      if (!response.ok) throw new Error('Failed to check');
      const res = await response.json();
      setFeedback(res);
      if (res.correct) {
        setScore(score + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!drill) {
      loadDrill();
    }
  }, []);

  if (!drill || loading) {
    return (
      <Card>
        <h4>❓ Not Given vs False Classifier</h4>
        <p>Loading...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h4>❓ Not Given vs False Classifier</h4>
      <p>Master the crucial distinction between FALSE and NOT GIVEN statements.</p>

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
      </div>

      <h5 style={{ marginBottom: '0.5rem' }}>Statement:</h5>
      <div style={{
        padding: '1rem',
        background: '#fff3e0',
        borderRadius: '6px',
        marginBottom: '1rem',
        fontStyle: 'italic'
      }}>
        "{drill.statement}"
      </div>

      <h5 style={{ marginBottom: '0.5rem' }}>Passage:</h5>
      <div style={{
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '6px',
        marginBottom: '1rem',
        lineHeight: '1.6',
        fontSize: '0.95rem'
      }}>
        {drill.passage}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Is this statement True, False, or Not Given?</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant={answer === 'True' ? 'primary' : 'outline'}
            onClick={() => {
              setAnswer('True');
              setFeedback(null);
            }}
          >
            ✅ True
          </Button>
          <Button
            variant={answer === 'False' ? 'primary' : 'outline'}
            onClick={() => {
              setAnswer('False');
              setFeedback(null);
            }}
          >
            ❌ False
          </Button>
          <Button
            variant={answer === 'Not Given' ? 'primary' : 'outline'}
            onClick={() => {
              setAnswer('Not Given');
              setFeedback(null);
            }}
          >
            ❓ Not Given
          </Button>
        </div>
      </div>

      <Button 
        onClick={checkAnswer} 
        disabled={!answer || feedback !== null}
        variant="primary"
      >
        Check Answer
      </Button>

      {feedback && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: feedback.correct ? '#e8f5e9' : '#ffebee',
          borderRadius: '6px'
        }}>
          <div style={{
            color: feedback.correct ? '#2e7d32' : '#c62828',
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            fontSize: '1.1rem'
          }}>
            {feedback.correct ? '✅ Correct!' : '❌ Incorrect'}
          </div>
          <div style={{
            marginBottom: '1rem',
            fontSize: '0.95rem',
            color: '#333'
          }}>
            {feedback.explanation}
          </div>
          <Button
            onClick={() => {
              setAnswer('');
              setFeedback(null);
              loadDrill();
            }}
            variant={feedback.correct ? 'primary' : 'outline'}
          >
            Next Question
          </Button>
        </div>
      )}
    </Card>
  );
}
