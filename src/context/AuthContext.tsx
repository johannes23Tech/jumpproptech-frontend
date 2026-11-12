import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../utils/api';
import { isJwtExpired } from '../utils/security';

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: 'landlord' | 'agent' | 'tenant' | 'maintenance' | 'superadmin';
};

type AuthContextType = {
  user: User | null;
  // Resolves with the raw API response. When `mfa_required` is true the
  // password was correct but the session is not established yet.
  login: (email: string, password: string) => Promise<any>;
  loginMfa: (mfaToken: string, code: string) => Promise<void>;
  loginWithData: (user: User, token: string) => void;
  // Replace the access token after a security event (MFA enable/disable)
  // without requiring the user object to be in memory.
  refreshToken: (token: string) => void;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = api.getUser();

    // Never restore a session whose token is missing, malformed or expired.
    if (!token || !savedUser || isJwtExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } else {
      setUser(savedUser);
    }
    setLoading(false);

    // If another tab logs out (or the token is cleared), mirror it here.
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'token' && !event.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Drop the session as soon as the JWT expires, even if the tab stays open.
  useEffect(() => {
    if (!user) return;

    const timer = window.setInterval(() => {
      if (isJwtExpired(localStorage.getItem('token'))) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [user]);

  const storeSession = (data: { token: string; user: User }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);

    // Second factor required: do not store anything yet.
    if (data?.mfa_required) return data;

    storeSession(data);
    return data;
  };

  const loginMfa = async (mfaToken: string, code: string) => {
    const data = await api.mfaLogin({ mfa_token: mfaToken, code });
    storeSession(data);
  };

  const loginWithData = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const refreshToken = (token: string) => {
    localStorage.setItem('token', token);

    // The user profile does not change on a token bump; restore it only if
    // the in-memory state is empty (e.g. page was restored mid-action).
    if (!user) {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          setUser(JSON.parse(saved) as User);
        } catch {
          // Corrupt payload: drop it rather than trusting it.
          localStorage.removeItem('user');
        }
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginMfa, loginWithData, refreshToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);