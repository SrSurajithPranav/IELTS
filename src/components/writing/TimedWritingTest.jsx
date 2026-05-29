import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function TimedWritingTest({ onComplete }) {
  const [phase, setPhase] = useState('task1'); // task1, task2, finished
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 && phase === 'task1') {
      setLocked(true);
      alert('Time for Task 1 is up! Moving to Task 2.');
      setPhase('task2');
      setTimeLeft(40 * 60); // 40 minutes for Task 2
    }
    if (timeLeft <= 0 && phase === 'task2') {
      setPhase('finished');
      if (onComplete) {
        onComplete({ task1: task1Text, task2: task2Text });
      }
    }
  }, [timeLeft, phase, task1Text, task2Text, onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (phase !== 'finished') {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    setPhase('finished');
    if (onComplete) {
      onComplete({ task1: task1Text, task2: task2Text });
    }
  };

  if (phase === 'finished') {
    return (
      <Card>
        <h3>✅ Test Complete!</h3>
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Task 1 Word Count:</strong> {task1Text.split(/\s+/).filter(w => w).length} words</p>
          <p><strong>Task 2 Word Count:</strong> {task2Text.split(/\s+/).filter(w => w).length} words</p>
        </div>
        <Button onClick={() => {
          if (onComplete) {
            onComplete({ task1: task1Text, task2: task2Text });
          }
        }}>
          Submit for Feedback
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>{phase === 'task1' ? 'Task 1 (20 min)' : 'Task 2 (40 min)'}</h3>
        <span style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: timeLeft < 60 ? '#f44336' : 'inherit',
          minWidth: '80px',
          textAlign: 'right'
        }}>
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>

      {phase === 'task1' && (
        <>
          <div style={{ 
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '6px',
            marginBottom: '1rem',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <strong>Task 1:</strong>
            <p>The chart below shows the changes in average house prices in different regions between 2000 and 2020. Write a description of the information shown.</p>
          </div>
          <textarea
            value={task1Text}
            onChange={(e) => !locked && setTask1Text(e.target.value)}
            disabled={locked}
            rows={10}
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              borderRadius: '6px',
              border: '1px solid #ddd',
              opacity: locked ? 0.6 : 1
            }}
            placeholder="Write your Task 1 response here (minimum 150 words)..."
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            Word count: {task1Text.split(/\s+/).filter(w => w).length}
          </div>
          {locked && <p style={{ color: '#f44336', fontWeight: 'bold', marginTop: '0.5rem' }}>❌ Task 1 time is up!</p>}
        </>
      )}

      {phase === 'task2' && (
        <>
          <div style={{ 
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '6px',
            marginBottom: '1rem',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <strong>Task 2:</strong>
            <p>In recent years, the use of artificial intelligence has increased dramatically. Some people believe this is beneficial, while others think it poses significant risks. Discuss both views and give your opinion.</p>
          </div>
          <textarea
            value={task2Text}
            onChange={(e) => setTask2Text(e.target.value)}
            rows={15}
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
            placeholder="Write your Task 2 response here (minimum 250 words)..."
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            Word count: {task2Text.split(/\s+/).filter(w => w).length}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Button onClick={handleSubmit} variant="primary">
              Submit Both Tasks
            </Button>
            <Button onClick={() => alert('Auto-submitting in: ' + formatTime(timeLeft))} variant="outline">
              Auto-submit {formatTime(timeLeft)}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
