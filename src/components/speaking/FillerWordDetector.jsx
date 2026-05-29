import React, { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well', 'i mean', 'erm'];

export default function FillerWordDetector({ onComplete }) {
  const [isListening, setIsListening] = useState(false);
  const [fillerCount, setFillerCount] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [startTime, setStartTime] = useState(null);
  const recognitionRef = useRef(null);

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      gain.gain.value = 0.2;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Audio context error:', err);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) {
          // Check for filler words
          FILLER_WORDS.forEach(filler => {
            const count = (transcript.match(new RegExp('\\b' + filler + '\\b', 'g')) || []).length;
            if (count > 0) {
              setFillerCount(c => c + count);
              playBeep();
            }
          });
          setTranscript(prev => prev + transcript + ' ');
        } else {
          interimText += transcript;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setStartTime(Date.now());
    setFillerCount(0);
    setTranscript('');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      if (onComplete) {
        const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
        onComplete({ fillerCount, transcript, duration });
      }
    }
  };

  return (
    <Card>
      <h4>🎙️ Filler Word Buzzer</h4>
      <p>Beeps every time you say: <em>um, uh, like, you know, basically, actually</em></p>
      
      <div style={{ 
        textAlign: 'center', 
        padding: '1.5rem',
        background: '#f5f5f5',
        borderRadius: '6px',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Filler Words Detected</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f44336' }}>
          {fillerCount}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {!isListening ? (
          <Button onClick={startListening} variant="primary">
            🎤 Start Speaking
          </Button>
        ) : (
          <>
            <Button onClick={stopListening} variant="danger">
              ⏹️ Stop Recording
            </Button>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff3e0',
              borderRadius: '6px',
              fontWeight: 'bold',
              color: '#e65100'
            }}>
              🔴 Recording...
            </div>
          </>
        )}
      </div>

      {transcript && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Transcript:</strong>
          <div style={{
            marginTop: '0.5rem',
            padding: '1rem',
            background: '#f9f9f9',
            borderRadius: '6px',
            maxHeight: '200px',
            overflowY: 'auto',
            lineHeight: '1.6'
          }}>
            {transcript}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
            💡 Try to reduce filler words in your next attempt. Aim for fewer than 5 in a 2-minute speech.
          </div>
        </div>
      )}
    </Card>
  );
}
