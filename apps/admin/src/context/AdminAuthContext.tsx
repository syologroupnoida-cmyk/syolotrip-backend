import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, AuthResponse } from '@traveler/contracts';
import { loginAdmin, demoLoginAdmin, logoutAdmin } from '../services/api';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  demoLogin: (role?: 'ADMIN') => Promise<AuthResponse>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('admin:unauthorized', handleUnauthorized);
    window.addEventListener('admin:logout', handleLogout);

    return () => {
      window.removeEventListener('admin:unauthorized', handleUnauthorized);
      window.removeEventListener('admin:logout', handleLogout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const authData = await loginAdmin({ email, password });
    const receivedToken =
      authData.tokens?.accessToken || (authData.tokens as any)?.access_token || null;
    setToken(receivedToken);
    setUser(authData.user || null);
    return authData;
  };

  const demoLogin = async (role: 'ADMIN' = 'ADMIN'): Promise<AuthResponse> => {
    const authData = await demoLoginAdmin(role);
    const receivedToken =
      authData.tokens?.accessToken || (authData.tokens as any)?.access_token || null;
    setToken(receivedToken);
    setUser(authData.user || null);
    return authData;
  };

  const logout = () => {
    logoutAdmin();
    setToken(null);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
