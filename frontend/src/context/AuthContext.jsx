import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getToken, getUser, setToken as persistToken, setUser as persistUser } from '../services/auth';
import { decodeToken, isTokenExpired } from '../utils/jwt';
import api, { setAuthErrorHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const login = useCallback(
    (newToken, userInfo, redirectTo = '/') => {
      persistToken(newToken);
      setToken(newToken);
      const derivedUser = userInfo || decodeToken(newToken) || null;
      if (derivedUser) {
        persistUser(derivedUser);
        setUser(derivedUser);
      }
      navigate(redirectTo, { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    setAuthErrorHandler(() => logout());
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    if (!decodeToken(token)) {
      logout();
      return;
    }
    if (isTokenExpired(token)) {
      logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;
    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        const payload = response?.data?.data || response?.data || null;
        if (payload) {
          persistUser(payload);
          setUser(payload);
        }
      } catch {
        // keep existing local user info if profile fetch fails
      }
    };

    loadProfile();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token) && !isTokenExpired(token),
      login,
      logout
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
