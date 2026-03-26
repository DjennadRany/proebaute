import { createContext } from 'react';
import type { User } from '../data/mockData';

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data._id === 'string' && data.email) return data as User;
  } catch {
    // ignore
  }
  return null;
}
