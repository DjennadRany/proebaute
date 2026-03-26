import { ReactNode, useState, useCallback } from 'react';
import { login as apiLogin } from '../api/client';
import type { User } from '../data/mockData';
import { AuthContext, STORAGE_KEY, loadStoredUser } from './auth-context';

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
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
