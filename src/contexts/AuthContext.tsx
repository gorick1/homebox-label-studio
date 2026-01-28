import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, isAuthenticated as checkAuth } from '@/lib/api';

const DEMO_MODE_KEY = 'demo_mode';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const authenticated = checkAuth();
    const demoMode = localStorage.getItem(DEMO_MODE_KEY) === 'true';
    
    setIsAuthenticated(authenticated || demoMode);
    setIsDemoMode(demoMode);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiLogin(email, password);
      setIsAuthenticated(true);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_MODE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsDemo = useCallback(() => {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    setIsDemoMode(true);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsAuthenticated(false);
    setIsDemoMode(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, isDemoMode, login, loginAsDemo, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
