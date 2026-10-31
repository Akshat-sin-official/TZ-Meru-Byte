import React, { createContext, useContext, useState, useEffect } from 'react';
import { campusApi, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: (role: 'admin' | 'department_coordinator' | 'faculty' | 'club') => Promise<void>;
  logout: () => void;
}

const CampusAuthContext = createContext<AuthContextType | undefined>(undefined);

export const CampusAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cit_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('cit_token');
      if (savedToken) {
        try {
          const res = await campusApi.getMe();
          setUser(res.user);
        } catch {
          localStorage.removeItem('cit_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await campusApi.login(email, pass);
    localStorage.setItem('cit_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const loginDemo = async (role: 'admin' | 'department_coordinator' | 'faculty' | 'club') => {
    const demoCredentials: Record<string, { email: string; pass: string }> = {
      admin: { email: 'admin@cit.edu', pass: 'CitAdmin2027!' },
      department_coordinator: { email: 'coord.cse@cit.edu', pass: 'CitCoord2027!' },
      faculty: { email: 'faculty.f19@cit.edu', pass: 'CitFaculty2027!' },
      club: { email: 'dramatics@cit.edu', pass: 'CitClub2027!' },
    };

    const creds = demoCredentials[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = () => {
    localStorage.removeItem('cit_token');
    setToken(null);
    setUser(null);
  };

  return (
    <CampusAuthContext.Provider value={{ user, token, loading, login, loginDemo, logout }}>
      {children}
    </CampusAuthContext.Provider>
  );
};

export const useCampusAuth = () => {
  const ctx = useContext(CampusAuthContext);
  if (!ctx) throw new Error('useCampusAuth must be used within CampusAuthProvider');
  return ctx;
};

