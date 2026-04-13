import { ReactNode, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from '../api/client';
import { supabase } from '../api/supabaseClient';
import type { User } from '../types/user';
import { AuthContext, STORAGE_KEY, loadStoredUser } from './auth-context';
import { useNotifications } from '../hooks/useNotifications';
import { trackLogin } from '../lib/gtag';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  // Notifications push (SW + Realtime)
  useNotifications(user);

  // Synchronise l'état avec la session Supabase (expiration, onglets multiples, confirmation email)
  useEffect(() => {
    type Session = import('@supabase/supabase-js').Session;
    const buildUserFromSession = (session: Session): User => {
      const meta = session.user.user_metadata ?? {};
      return {
        _id: session.user.id,
        role: (meta.role === 'professional' ? 'professional' : 'client') as User['role'],
        firstName: meta.first_name || meta.firstName || '',
        lastName: meta.last_name || meta.lastName || '',
        email: session.user.email ?? '',
        phone: meta.phone,
      };
    };

    // Vérifie la session active au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      } else if (!loadStoredUser()) {
        // Session Supabase active mais pas de user en localStorage (ex: après confirmation email)
        const u = buildUserFromSession(session);
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    });

    // Écoute les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      } else if (event === 'SIGNED_IN' && session) {
        // Déclenché après confirmation d'email ou connexion OAuth
        const stored = loadStoredUser();
        if (!stored || stored._id !== session.user.id) {
          const u = buildUserFromSession(session);
          // Stocker sans phone (PII sensible — lisible via session Supabase si besoin)
          const toStore: User = {
            _id: u._id,
            role: u.role,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
          trackLogin(u.role === 'professional' ? 'professional' : 'client', 'email');
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
        // phone volontairement exclu du localStorage (PII — disponible via session Supabase)
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));

      // Track login event
      trackLogin(u.role === 'professional' ? 'professional' : 'client', 'email');

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
