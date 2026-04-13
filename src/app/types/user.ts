/**
 * Type utilisateur de l'application — source unique de vérité.
 * Remplace l'interface User dispersée dans mockData.ts (supprimé).
 * Synchronisé avec la table public.users de Supabase.
 */
export interface User {
  _id: string;
  role: 'client' | 'professional';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}
