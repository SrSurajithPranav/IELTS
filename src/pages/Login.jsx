import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../services/api';

function InputField({ label, type = 'text', value, onChange, placeholder, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'var(--bg3)',
          border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '13px 16px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 180ms, box-shadow 180ms',
          boxShadow: focused ? '0 0 0 3px var(--accent-soft)' : 'none',
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email.trim() || !pass.trim()) { setErr('Email and password are required.'); return; }
    setErr(''); setLoading(true);
    try {
      await login(email.trim(), pass);
    } catch (e) {
      setErr(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, var(--accent-soft) 0%, transparent 60%), var(--bg)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{
            fontFamily: 'Fraunces, serif', fontSize: 42, fontWeight: 700,
            color: 'var(--accent)', letterSpacing: '1px', lineHeight: 1,
          }}>
            IELTS<span style={{ color: 'var(--gold)' }}>Pro</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
            AI-Powered IELTS Learning Platform
          </p>
          {/* Decorative dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {['var(--accent)', 'var(--gold)', 'var(--purple)'].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
            ))}
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 32,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Welcome back 👋
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
            Sign in to continue your IELTS journey
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <InputField
              label="Password"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handle()}
            />

            {err && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: 12, color: 'var(--danger)',
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(197,48,48,.2)',
                  borderRadius: 8, padding: '8px 12px',
                }}
              >
                {err}
              </motion.div>
            )}

            <button
              onClick={handle}
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: '#fff', fontSize: 15, fontWeight: 700,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 16px var(--accent-glow)',
                fontFamily: 'inherit',
                marginTop: 4,
                transition: 'all 180ms',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
            >
              {loading ? '⏳ Signing in…' : 'Sign In →'}
            </button>
          </div>

          {/* Info box */}
          <div style={{
            marginTop: 20,
            padding: '12px 14px',
            background: 'var(--bg3)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--muted)',
            border: '1px dashed var(--border)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Getting started?</div>
            <div>Use your credentials provided by your teacher. Contact them if you haven't received login details.</div>
            {import.meta.env.DEV && (
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>API: {API_BASE_URL}</div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted2)', marginTop: 20 }}
        >
          IELTSPro — AI-Powered Band Score Improvement
        </motion.p>
      </div>
    </div>
  );
}
