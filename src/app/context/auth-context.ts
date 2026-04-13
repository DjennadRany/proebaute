import { createContext } from 'react';
import type { User } from '../types/user';

export const STORAGE_KEY = 'beautyhub_user';

export type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function loadStoredUser(): User | null {
  try {
    // Check localStorage availability (iOS private mode, etc.)
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data._id === 'string' && data.email) return data as User;
  } catch {
    // Silently ignore errors (private mode, quota exceeded, etc.)
  }
  return null;
}
