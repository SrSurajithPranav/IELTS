import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function ClicheDetector({ text }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkCliches = async () => {
    if (!text || text.trim().length < 50) {
      setError('Please write at least 50 characters');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/writing/cliches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Failed to detect clichés');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h4>⛔ Over-used Words Detector</h4>
      <p>Identifies banned IELTS clichés and suggests alternatives to improve band score.</p>
      
      <Button onClick={checkCliches} loading={loading} disabled={loading || !text}>
        {loading ? 'Checking...' : 'Check for Clichés'}
      </Button>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee', borderRadius: '6px', color: '#c33' }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{ marginTop: '1rem' }}>
          {analysis.cliches.length === 0 ? (
            <div style={{ 
              padding: '1rem', 
              background: '#e8f5e9',
              borderRadius: '6px',
              color: '#2e7d32'
            }}>
              ✅ No common clichés detected! Excellent vocabulary choices.
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff3e0', borderRadius: '6px' }}>
                <strong>Found {analysis.cliches.length} cliché(s):</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analysis.cliches.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    background: '#f5f5f5',
                    borderLeft: '3px solid #ff9800',
                    borderRadius: '4px'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>"{item.cliche}"</span>
                      <span style={{ color: '#666', marginLeft: '0.5rem' }}>({item.count}x)</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <strong>Better alternatives:</strong> {item.alternative}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
