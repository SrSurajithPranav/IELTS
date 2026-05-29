import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

export default function CohesiveDeviceAnalyzer({ text }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeCohesive = async () => {
    if (!text || text.trim().length < 50) {
      setError('Please write at least 50 characters');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/writing/cohesive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Failed to analyze cohesive devices');
      
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
      <h4>🔗 Cohesive Device Density</h4>
      <p>Analyzes linking words to estimate band score (target: 10-12 per 250 words for band 7+)</p>
      
      <Button onClick={analyzeCohesive} loading={loading} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Analyze Cohesion'}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Cohesive Devices Found</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{analysis.count}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Word Count</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{analysis.word_count}</div>
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem', 
              background: 'white',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Density: <strong>{analysis.density}%</strong></div>
              <div style={{ 
                width: '100%', 
                height: '8px',
                background: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, (analysis.density / analysis.target_density) * 100)}%`,
                  height: '100%',
                  background: getBandColor(analysis.band)
                }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                Target: {analysis.target_density}% for Band 7+
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: getBandColor(analysis.band),
              color: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              Estimated Band: {analysis.band}
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h5 style={{ marginBottom: '0.5rem' }}>Text with Highlighted Devices:</h5>
            <div 
              style={{ 
                padding: '1rem',
                background: '#f9f9f9',
                borderRadius: '6px',
                lineHeight: '1.6',
                fontSize: '0.95rem'
              }}
              dangerouslySetInnerHTML={{ 
                __html: analysis.highlighted_text.replace(/<mark class="cohesive">/g, '<mark style="background: #fff59d; padding: 2px 4px; borderRadius: 3px;">').replace(/<\/mark>/g, '</mark>')
              }} 
            />
          </div>
        </div>
      )}

      <style>{`
        mark {
          background-color: #fff59d;
          padding: 2px 4px;
          border-radius: 3px;
        }
      `}</style>
    </Card>
  );
}
