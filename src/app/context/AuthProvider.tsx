import { ReactNode, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from '../api/client';
import { supabase } from '../api/supabaseClient';
import type { User } from '../data/mockData';
import { AuthContext, STORAGE_KEY, loadStoredUser } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronise l'état avec la session Supabase (expiration, onglets multiples, etc.)
  useEffect(() => {
    // Vérifie la session active au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Session expirée ou absente → déconnexion propre
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    // Écoute les changements de session (expiration, déconnexion, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
