import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { User } from '../data/mockData';
import { login as apiLogin } from '../api/client';

const STORAGE_KEY = 'beautyhub_user';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data._id === 'string' && data.email) return data as User;
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const apiUser = await apiLogin(email, password);
      const u: User = {
        _id: apiUser._id,
        role: apiUser.role,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        email: apiUser.email,
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    // La session Supabase est gérée côté client.ts via supabase.auth
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.warn('useAuth called outside AuthProvider. Using fallback auth implementation.');
    return {
      user: null,
      isLoading: false,
      login: async (email: string, password: string) => {
        // Fallback minimal: on utilise directement l'API Supabase,
        // puis on stocke l'utilisateur pour que le prochain rendu
        // (avec AuthProvider) récupère les infos depuis localStorage.
        const apiUser = await apiLogin(email, password);
        const u: User = {
          _id: apiUser._id,
          role: apiUser.role,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          email: apiUser.email,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
      },
    };
  }
  return ctx;
}
