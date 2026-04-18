import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, type AppRole } from '@/lib/api/auth';

// Compat : on garde la même interface que l'ancien AuthContext (user/session)
// pour ne pas casser les pages. `user` n'a plus que { id, email }.
interface SimpleUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: SimpleUser | null;
  session: SimpleUser | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then((me) => {
      if (me) {
        setUser({ id: me.userId, email: me.email });
        setRole(me.role);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      setUser({ id: res.userId, email: res.email });
      setRole(res.role);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    authApi.logout();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
