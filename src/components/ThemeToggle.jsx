import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} style={{ position: 'fixed', right: 16, bottom: 16, padding: '8px 12px', borderRadius: 8 }}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
