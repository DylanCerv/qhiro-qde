import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { auth, signInWithEmailAndPassword } from '../config/firebase';

const TOKEN_KEY = 'qhiro_qde_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (token) => {
    api.setToken(token);
    const response = await api.getMe();
    if (response.user?.role !== 'admin') {
      api.setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      setProfile(null);
      throw new Error('QDE es solo para administradores. Usa Qhiro Symbiotic si eres productor.');
    }
    setProfile(response.user);
    localStorage.setItem(TOKEN_KEY, token);
    setError(null);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    loadProfile(savedToken)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        api.setToken(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [loadProfile]);

  const login = useCallback(
    async ({ email, password }) => {
      setError(null);
      const session = await api.login({ email, password });
      if (auth) {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await loadProfile(session.token);
    },
    [loadProfile],
  );

  const logout = useCallback(() => {
    setProfile(null);
    api.setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      isAuthenticated: Boolean(profile),
      isAdmin: profile?.role === 'admin',
      login,
      logout,
      setError,
    }),
    [profile, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
