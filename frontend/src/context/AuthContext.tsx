'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: 'admin' | 'development' | 'routine';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isDevelopment: boolean;
  isDevelopmentOrAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isDevelopment: false,
  isDevelopmentOrAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify current token with timeout so LAN network hangs never freeze the app
        api.get('/auth/me', { timeout: 3000 })
          .then((res) => {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setLoading(false);
          })
          .catch(() => {
            logout();
          });
        return;
      } catch {
        logout();
        return;
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setLoading(false);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'admin';
  const isDevelopment = user?.role === 'development';
  const isDevelopmentOrAdmin = user?.role === 'admin' || user?.role === 'development';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isDevelopment, isDevelopmentOrAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
