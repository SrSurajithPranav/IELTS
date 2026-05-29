import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function EssayStructureChecker({ text }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkStructure = async () => {
    if (!text || text.trim().length < 100) {
      setError('Please write at least 100 characters');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/writing/structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Failed to analyze structure');
      
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
      <h4>✓ Essay Structure Checker</h4>
      <p>Verifies that your essay has all required sections: Introduction, Body 1, Body 2, and Conclusion.</p>
      
      <Button onClick={checkStructure} loading={loading} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Check Structure'}
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
            background: analysis.complete ? '#e8f5e9' : '#fff3e0',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0' }}>
              {analysis.complete ? '✅ Structure is complete!' : '⚠️ Missing sections:'}
            </h5>
            {!analysis.complete && (
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {analysis.missing.map((section, i) => (
                  <li key={i}>{section}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{analysis.has_introduction ? '✅' : '❌'}</span>
              <span>Introduction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{analysis.has_body_1 ? '✅' : '❌'}</span>
              <span>Body 1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{analysis.has_body_2 ? '✅' : '❌'}</span>
              <span>Body 2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{analysis.has_conclusion ? '✅' : '❌'}</span>
              <span>Conclusion</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
