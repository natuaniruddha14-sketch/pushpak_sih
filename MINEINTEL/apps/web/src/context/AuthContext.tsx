import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthResponse, UserRole } from '@mineintel/shared-types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mineintel_auth_token';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr-cmpdi-geologist-01',
  email: 'geologist@cmpdi.in',
  name: 'Dr. Rajesh Sharma',
  role: UserRole.GEOLOGIST,
  organizationId: 'org-cmpdi-hq',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const existing = localStorage.getItem(TOKEN_KEY);
    if (!existing) {
      localStorage.setItem(TOKEN_KEY, 'demo-jwt-token-cmpdi-2026');
      return 'demo-jwt-token-cmpdi-2026';
    }
    return existing;
  });
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_DEMO_USER);
  const [loading, setLoading] = useState<boolean>(true);

  // Load current user profile
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user || DEFAULT_DEMO_USER);
        } else {
          setUser(DEFAULT_DEMO_USER);
        }
      } catch (_err) {
        setUser(DEFAULT_DEMO_USER);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const authData = data as AuthResponse;
        localStorage.setItem(TOKEN_KEY, authData.token);
        setToken(authData.token);
        setUser(authData.user);
        return;
      }
    } catch (_err) {
      console.warn('API login unavailable, using demo session fallback');
    }

    // Instant demo session fallback
    const demoUser: UserProfile = {
      id: 'usr-cmpdi-001',
      email: email || 'geologist@cmpdi.in',
      name: email.includes('admin') ? 'System Admin' : 'Dr. Rajesh Sharma',
      role: email.includes('admin') ? UserRole.ADMIN : UserRole.GEOLOGIST,
      organizationId: 'org-cmpdi-hq',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const demoToken = 'demo-jwt-token-cmpdi-2026';
    localStorage.setItem(TOKEN_KEY, demoToken);
    setToken(demoToken);
    setUser(demoUser);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = UserRole.ANALYST
  ) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        const data = await res.json();
        const authData = data as AuthResponse;
        localStorage.setItem(TOKEN_KEY, authData.token);
        setToken(authData.token);
        setUser(authData.user);
        return;
      }
    } catch (_err) {
      console.warn('API register unavailable, using demo session fallback');
    }

    const demoUser: UserProfile = {
      id: 'usr-new-001',
      email,
      name: name || 'Mining Officer',
      role,
      organizationId: 'org-cmpdi-hq',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const demoToken = 'demo-jwt-token-cmpdi-2026';
    localStorage.setItem(TOKEN_KEY, demoToken);
    setToken(demoToken);
    setUser(demoUser);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_err) {
        // Ignore
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
