import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function Part3DepthChecker({ question }) {
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeDepth = async () => {
    if (!answer || answer.trim().length < 30) {
      setError('Please provide a more detailed answer (at least 30 characters)');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/speaking/part3-depth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer, question })
      });

      if (!response.ok) throw new Error('Failed to analyze depth');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (band) => {
    if (band === '7+') return '#4caf50';
    if (band === '6') return '#ff9800';
    return '#f44336';
  };

  return (
    <Card>
      <h4>🎙️ Part 3 - Depth Checker</h4>
      <p>Checks if your answer includes a reason, example, and contrasting viewpoint.</p>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Question:
        </label>
        <div style={{
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {question || 'No question provided'}
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        placeholder="Type your Part 3 answer here..."
        style={{
          width: '100%',
          padding: '0.5rem',
          fontSize: '1rem',
          fontFamily: 'inherit',
          borderRadius: '6px',
          border: '1px solid #ddd',
          marginBottom: '1rem'
        }}
      />
      
      <Button onClick={analyzeDepth} loading={loading} disabled={loading || !answer}>
        {loading ? 'Analyzing...' : 'Check Answer Depth'}
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
            background: getBandColor(analysis.band),
            color: 'white',
            borderRadius: '6px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Estimated Band</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{analysis.band}</div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Depth Score: {analysis.score}/3</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem',
                  background: analysis.has_reason ? '#e8f5e9' : '#ffebee',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div>{analysis.has_reason ? '✅' : '❌'}</div>
                  <div style={{ fontSize: '0.8rem' }}>Reason</div>
                </div>
                <div style={{
                  padding: '0.5rem',
                  background: analysis.has_example ? '#e8f5e9' : '#ffebee',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div>{analysis.has_example ? '✅' : '❌'}</div>
                  <div style={{ fontSize: '0.8rem' }}>Example</div>
                </div>
                <div style={{
                  padding: '0.5rem',
                  background: analysis.has_contrast ? '#e8f5e9' : '#ffebee',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div>{analysis.has_contrast ? '✅' : '❌'}</div>
                  <div style={{ fontSize: '0.8rem' }}>Contrast</div>
                </div>
              </div>
            </div>

            {analysis.feedback.length > 0 && (
              <div>
                <strong style={{ color: '#f44336' }}>Improvements needed:</strong>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
                  {analysis.feedback.map((f, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
