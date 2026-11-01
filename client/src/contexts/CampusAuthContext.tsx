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

const DEMO_FALLBACK_USERS: Record<string, User> = {
  'admin@cit.edu': {
    id: 'usr-cit-admin-001',
    email: 'admin@cit.edu',
    name: 'Prof. M. K. Sharma (Dean Academics)',
    role: 'admin',
    department: 'Academic Affairs',
  },
  'coord.cse@cit.edu': {
    id: 'usr-cit-coord-002',
    email: 'coord.cse@cit.edu',
    name: 'Dr. A. Verma (CSE Coordinator)',
    role: 'department_coordinator',
    department: 'CSE',
  },
  'faculty.f19@cit.edu': {
    id: 'usr-cit-faculty-003',
    email: 'faculty.f19@cit.edu',
    name: 'Dr. S. Rath (Faculty F19)',
    role: 'faculty',
    department: 'CSE',
    facultyId: 'F19',
  },
  'dramatics@cit.edu': {
    id: 'usr-cit-club-004',
    email: 'dramatics@cit.edu',
    name: 'Dramatics Society',
    role: 'club',
    clubName: 'Dramatics Society',
  },
};

export const CampusAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cit_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('cit_token');
      if (savedToken) {
        // If it was a mock offline token, restore user directly from stored session
        if (savedToken.startsWith('mock-token-')) {
          const storedUser = localStorage.getItem('cit_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
              setLoading(false);
              return;
            } catch {}
          }
        }
        try {
          const res = await campusApi.getMe();
          setUser(res.user);
        } catch {
          // If network / DB down, try restoring stored user before clearing
          const storedUser = localStorage.getItem('cit_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
              setLoading(false);
              return;
            } catch {}
          }
          localStorage.removeItem('cit_token');
          localStorage.removeItem('cit_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await campusApi.login(email, pass);
      localStorage.setItem('cit_token', res.token);
      localStorage.setItem('cit_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed. Please verify your credentials.';
      throw new Error(msg);
    }
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
    localStorage.removeItem('cit_user');
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
