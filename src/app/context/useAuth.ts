import { useContext } from 'react';
import { login as apiLogin } from '../api/client';
import type { User } from '../data/mockData';
import { AuthContext, STORAGE_KEY, type AuthContextType } from './auth-context';

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn(
        '[useAuth] Appel hors AuthProvider (souvent un flash pendant le HMR Vite). Rechargez la page si le problème persiste.',
      );
    }
    return {
      user: null,
      isLoading: false,
      login: async (email: string, password: string) => {
        const apiUser = await apiLogin(email, password);
        const u: User = {
          _id: apiUser._id,
          role: apiUser.role,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          email: apiUser.email,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        return u;
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
      },
    };
  }
  return ctx;
}
