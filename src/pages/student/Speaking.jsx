import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submissionsAPI, aiAPI, pushMistakeMemory } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

const PROMPTS = {
  part1: [
    "Tell me about your hometown and what makes it special.",
    "What type of music do you listen to and why?",
    "How do you usually spend your weekends?",
    "Describe your daily routine.",
  ],
  part2: [
    "Describe a memorable lesson you learned recently.",
    "Talk about a place you visited that exceeded expectations.",
    "Describe a person who motivated you to improve.",
    "Talk about a skill you are currently learning.",
  ],
  part3: [
    "How can schools better prepare students for real-world communication?",
    "Do you think technology improves public speaking skills? Why?",
    "Should communication skills be assessed more strictly in education?",
    "How has the internet changed how people communicate?",
  ],
};

export default function SpeakingPage() {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [part, setPart] = useState('part1');
  const [prompt, setPrompt] = useState(PROMPTS.part1[0]);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    submissionsAPI.getStudentSubs(user.id)
      .then((res) => setSubs((res || []).filter((s) => s.task?.type === 'speaking')))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, [user]);

  // Speech recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSpeechSupported(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (event) => {
      let finalText = ''; let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += `${chunk} `;
        else interimText += `${chunk} `;
      }
      if (finalText) setTranscript((prev) => `${prev} ${finalText}`.trim());
      setLiveTranscript(interimText.trim());
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    setSpeechSupported(true);
    return () => { rec.stop(); recognitionRef.current = null; };
  }, []);

  const newPrompt = () => {
    const pool = PROMPTS[part] || PROMPTS.part1;
    setPrompt(pool[Math.floor(Math.random() * pool.length)]);
  };

  useEffect(() => { newPrompt(); }, [part]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { setLiveTranscript(''); recognitionRef.current.start(); setIsListening(true); }
  };

  const analyze = async () => {
    if (!transcript.trim()) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await aiAPI.analyzeSpeaking(transcript);
      setAnalysis(res);
      pushMistakeMemory(['speaking fluency', 'speaking pronunciation', ...(res?.analysis?.suggestions || [])]);
    } catch (e) {
      notifyError(e.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="fade-up playfair" style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Speaking Lab 🎧
      </div>

      {/* AI Interviewer */}
      <Card className="fade-up-2" style={{ marginBottom: 16, border: '1px solid var(--accent-glow)', background: 'var(--accent-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>🤖 AI Interviewer Simulation</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['part1', 'part2', 'part3'].map((p) => (
              <Button key={p} size="xs" variant={part === p ? 'primary' : 'outline'} onClick={() => setPart(p)}>
                {p.replace('part', 'Part ')}
              </Button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, lineHeight: 1.5, color: 'var(--text)' }}>{prompt}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" variant="soft" onClick={newPrompt}>🔄 New Prompt</Button>
          {speechSupported ? (
            <Button size="sm" variant={isListening ? 'danger' : 'outline'} onClick={toggleListening}>
              {isListening ? '⏹ Stop Transcript' : '🎙 Live Transcript'}
            </Button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Speech recognition unavailable</span>
          )}
        </div>
        {liveTranscript && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'var(--bg3)', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
            🎙 {liveTranscript}
          </div>
        )}
      </Card>

      {/* AI Analysis */}
      <Card className="fade-up-3" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>AI Speaking Coach</div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          placeholder="Paste your speaking transcript here or use Live Transcript above…"
          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ marginTop: 12 }}>
          <Button onClick={analyze} disabled={!transcript.trim() || analyzing} loading={analyzing}>
            {analyzing ? 'Analyzing…' : '🔍 Analyze Speaking'}
          </Button>
        </div>
        {analysis && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>AI Analysis</div>
              <Badge label={`Band ${analysis.band_estimate}`} color="success" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Fluency', val: analysis.analysis?.fluency_score },
                { label: 'Pronunciation', val: analysis.analysis?.pronunciation_score },
                { label: 'Grammar', val: analysis.analysis?.grammar_score },
                { label: 'Filler Words', val: analysis.analysis?.filler_count },
              ].map((m, i) => (
                <div key={i} style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Suggestions:</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>
              {(analysis.analysis?.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </Card>

      {/* Past Submissions */}
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Past Submissions</div>
      {loading ? <SkeletonList count={3} cardHeight={80} /> : subs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
          No speaking submissions yet. Submit from Today's Tasks.
        </Card>
      ) : subs.map((s) => (
        <Card key={s.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.task?.title || `Task #${s.task_id}`}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {new Date(s.submitted_at).toLocaleString()}
              </div>
            </div>
            <StatusBadge status={s.status} />
          </div>
          {s.file_url && (
            <div style={{ marginTop: 12 }}>
              <audio controls src={s.file_url} style={{ width: '100%', height: 36 }} />
            </div>
          )}
          {s.feedback_text && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--success-soft)', borderRadius: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>Teacher: </span>
              {s.feedback_text}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
