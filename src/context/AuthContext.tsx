import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { apiGetMe } from '@/services/api';

interface AuthContextType {
  user:            User | null;
  isAuthenticated: boolean;
  setSession:      (token: string, user: User) => void;
  logout:          () => void;
  loading:         boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexory-token');
    if (token) {
      apiGetMe()
        .then(u => setUser({ id: u.id, name: u.name, email: u.email, role: u.role as User['role'] }))
        .catch(() => localStorage.removeItem('nexory-token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setSession = (token: string, u: User) => {
    localStorage.setItem('nexory-token', token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('nexory-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, setSession, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
