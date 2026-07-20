import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { clearTokens, getAccessToken, loginWithPassword } from './auth';
import type { AdminMenu, ApiResponse, MeData } from './types';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  username: string | null;
  nickname: string | null;
  roles: string[];
  permissions: string[];
  menus: AdminMenu[];
  hasPermission: (code: string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function applyMe(
  data: MeData,
  setters: {
    setUsername: (v: string | null) => void;
    setNickname: (v: string | null) => void;
    setRoles: (v: string[]) => void;
    setPermissions: (v: string[]) => void;
    setMenus: (v: AdminMenu[]) => void;
  },
) {
  setters.setUsername(data.username);
  setters.setNickname(data.nickname ?? null);
  setters.setRoles(data.roles ?? []);
  setters.setPermissions(data.permissions ?? []);
  setters.setMenus(data.menus ?? []);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [menus, setMenus] = useState<AdminMenu[]>([]);

  const setters = useMemo(() => ({
    setUsername, setNickname, setRoles, setPermissions, setMenus,
  }), []);

  const bootstrap = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<ApiResponse<MeData>>('/admin/me');
      applyMe(res.data, setters);
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, [setters]);

  useEffect(() => { void bootstrap(); }, [bootstrap]);

  const hasPermission = useCallback((code: string) => {
    if (!code) return true;
    if (roles.includes('SUPER_ADMIN')) return true;
    return permissions.includes(code);
  }, [permissions, roles]);

  const login = useCallback(async (usernameInput: string, password: string) => {
    await loginWithPassword(usernameInput, password);
    const res = await apiFetch<ApiResponse<MeData>>('/admin/me');
    applyMe(res.data, setters);
  }, [setters]);

  const logout = useCallback(() => {
    clearTokens();
    setUsername(null);
    setNickname(null);
    setRoles([]);
    setPermissions([]);
    setMenus([]);
    window.location.href = '/login';
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    authenticated: !!username,
    username,
    nickname,
    roles,
    permissions,
    menus,
    hasPermission,
    login,
    logout,
  }), [loading, username, nickname, roles, permissions, menus, hasPermission, login, logout]);

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
