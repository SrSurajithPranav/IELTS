import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) { setLoading(false); return; }
    authAPI.getProfile()
      .then((res) => {
        if (res && res.id) {
          setUser({
            id: res.id,
            name: res.name,
            email: res.email,
            role: res.role,
            streak: res.streak || 0,
            score: res.score || 0,
            zoom_link: res.zoom_link || null,
            weak_areas: res.weak_areas || [],
          });
        } else {
          localStorage.removeItem('jwt_token');
        }
      })
      .catch(() => localStorage.removeItem('jwt_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password);
    if (!res || !res.token) throw new Error('Invalid response from server');
    localStorage.setItem('jwt_token', res.token);
    const usr = res.user;
    const u = {
      id: usr.id,
      name: usr.name,
      email: usr.email,
      role: usr.role,
      streak: usr.streak || 0,
      score: usr.score || 0,
      zoom_link: usr.zoom_link || null,
      weak_areas: usr.weak_areas || [],
    };
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
