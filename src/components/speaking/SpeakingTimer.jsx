import React, { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const SAMPLE_CUE_CARDS = [
  'Describe a time when you helped someone. You should say: who the person was, what the problem was, how you helped, and explain why you wanted to help.',
  'Describe an interesting place you have visited. You should say: where it was, when you went there, what you saw, and explain why it was interesting.',
  'Describe a hobby you enjoy. You should say: what the hobby is, how long you have been doing it, how often you do it, and explain why you enjoy it.',
];

export default function SpeakingTimer({ onComplete, cueCard }) {
  const [mode, setMode] = useState('strict'); // strict, generous, analysis
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [analysis, setAnalysis] = useState(null);
  const [phase, setPhase] = useState('setup'); // setup, recording, done
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const [currentCueCard] = useState(cueCard || SAMPLE_CUE_CARDS[0]);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRecording && timeLeft === 0) {
      if (mode === 'strict') {
        stopRecording();
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isRecording, timeLeft, mode]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        analyzeRecording(blob);
      };
      recorder.start();
      setIsRecording(true);
      setPhase('recording');
      const limit = mode === 'strict' ? 120 : mode === 'generous' ? 150 : 120;
      setTimeLeft(limit);
    } catch (err) {
      alert('Could not access microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearTimeout(timerRef.current);
    }
  };

  const analyzeRecording = async (blob) => {
    // In production, send to backend for speech-to-text analysis
    const duration = 120; // Mock
    const pacing = timeLeft > 0 ? 'Great timing!' : 'You spoke past the time limit.';
    
    const result = {
      duration,
      pacing,
      mode,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setAnalysis(result);
    setPhase('done');
    
    if (onComplete) {
      onComplete(result);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${mins}:${seconds.toString().padStart(2, '0')}`;
  };

  if (phase === 'setup') {
    return (
      <Card>
        <h4>🎙️ Part 2 Cue Card Practice</h4>
        
        <div style={{ 
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <strong>Your cue card:</strong>
          <p>{currentCueCard}</p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Select mode:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <Button 
              variant={mode === 'strict' ? 'primary' : 'outline'} 
              onClick={() => setMode('strict')}
            >
              <strong>Strict</strong>
              <div style={{ fontSize: '0.8rem' }}>Cuts at 2:00</div>
            </Button>
            <Button 
              variant={mode === 'generous' ? 'primary' : 'outline'} 
              onClick={() => setMode('generous')}
            >
              <strong>Generous</strong>
              <div style={{ fontSize: '0.8rem' }}>Allows 2:30</div>
            </Button>
            <Button 
              variant={mode === 'analysis' ? 'primary' : 'outline'} 
              onClick={() => setMode('analysis')}
            >
              <strong>Analysis</strong>
              <div style={{ fontSize: '0.8rem' }}>Detailed stats</div>
            </Button>
          </div>
        </div>

        <Button onClick={startRecording} variant="primary">
          🎤 Start Speaking (1 min prep)
        </Button>
      </Card>
    );
  }

  if (phase === 'recording') {
    return (
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Time Remaining</div>
          <div style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: timeLeft < 10 ? '#f44336' : 'inherit',
            fontFamily: 'monospace'
          }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{
            marginTop: '1rem',
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${mode === 'strict' ? (timeLeft / 120) * 100 : (timeLeft / 150) * 100}%`,
              height: '100%',
              background: '#4caf50',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#fff3e0',
          borderRadius: '6px',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          🔴 Recording in progress...
        </div>

        <Button onClick={stopRecording} variant="danger">
          ⏹️ Stop Recording
        </Button>
      </Card>
    );
  }

  if (phase === 'done' && analysis) {
    return (
      <Card>
        <h4>✅ Recording Complete</h4>
        
        <div style={{
          padding: '1rem',
          background: '#e8f5e9',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#2e7d32', marginBottom: '0.25rem' }}>Duration</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1b5e20' }}>
              {analysis.duration} seconds
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#2e7d32', marginBottom: '0.25rem' }}>Pacing</div>
            <div style={{ fontSize: '1.1rem', color: '#1b5e20' }}>{analysis.pacing}</div>
          </div>
        </div>

        <div style={{
          padding: '0.75rem',
          background: '#f5f5f5',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          <strong>Mode:</strong> {analysis.mode.charAt(0).toUpperCase() + analysis.mode.slice(1)}<br/>
          <strong>Recorded:</strong> {analysis.timestamp}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={() => {
            setPhase('setup');
            setTimeLeft(120);
            setAnalysis(null);
          }} variant="outline">
            Try Again
          </Button>
          {onComplete && (
            <Button onClick={() => onComplete(analysis)} variant="primary">
              Submit Recording
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return null;
}
