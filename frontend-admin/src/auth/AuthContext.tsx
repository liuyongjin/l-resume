import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { clearTokens, getAccessToken, loginWithPassword } from './auth';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  username: string | null;
  roles: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  const bootstrap = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; data: { username: string; roles: string[] } }>('/admin/me');
      setUsername(res.data.username);
      setRoles(res.data.roles ?? []);
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void bootstrap(); }, [bootstrap]);

  const login = useCallback(async (usernameInput: string, password: string) => {
    await loginWithPassword(usernameInput, password);
    const res = await apiFetch<{ success: boolean; data: { username: string; roles: string[] } }>('/admin/me');
    setUsername(res.data.username);
    setRoles(res.data.roles ?? []);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUsername(null);
    setRoles([]);
    window.location.href = '/login';
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    authenticated: !!username,
    username,
    roles,
    login,
    logout,
  }), [loading, username, roles, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useLoginRedirect() {
  const navigate = useNavigate();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && authenticated) {
      navigate('/', { replace: true });
    }
  }, [authenticated, loading, navigate]);
}
