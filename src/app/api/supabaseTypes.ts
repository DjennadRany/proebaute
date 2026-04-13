/**
 * Raw Supabase database row types — mirror the PostgreSQL schema.
 * Used in client.ts to replace scattered `as any` casts with proper typing.
 * When Supabase CLI is available, replace this file with generated types:
 *   npx supabase gen types typescript --project-id YOUR_ID > src/app/api/database.types.ts
 */

export interface ServiceRow {
  id: string;
  professional_id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  duration: number | null;
  media: string[] | null;
  rating_average: number | null;
  likes_count: number | null;
  reviews_count: number | null;
}

export interface ProfessionalRow {
  id: string;
  user_id: string | null;
  professional_name: string;
  specialty: string;
  bio: string | null;
  location: string | null;
  rating_average: number | null;
  reviews_count: number | null;
  verified: boolean | null;
  gallery: string[] | null;
  postal_code: string | null;
  city: string | null;
  address: string | null;
  siren: string | null;
  coordinates: { lat: number; lng: number } | null;
  lat?: number | null;
  lng?: number | null;
}

export interface BookingRow {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  booking_date: string;
  time_slot: string;
  status: string;
  amount: number | null;
  penalty_applied?: unknown;
  stripe_payment_intent_id?: string | null;
}

export interface BookingWithJoin extends BookingRow {
  services: ServiceRow | null;
  professionals: ProfessionalRow | null;
}

export interface BookingSlotRow {
  time_slot: string;
  status: string;
  service_id: string | null;
}

export interface ServiceDurationRow {
  id: string;
  duration: number | null;
}

export interface ConversationRow {
  id: string;
  participants: string[] | null;
  last_message: string | null;
  updated_at: string | null;
  archived: boolean | null;
  blocked_by: string[] | null;
  reported_by: string[] | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_status: boolean;
}

export interface ReviewRow {
  id: string;
  booking_id: string | null;
  client_id: string | null;
  professional_id: string | null;
  service_id: string | null;
  rating: number;
  comment: string;
  created_at: string | null;
  client_name?: string | null;
}

export interface FavoriteRow {
  id: string;
  user_id: string;
  target_type: 'service' | 'professional';
  target_id: string;
}

export interface LikeRow {
  id: string;
  user_id: string;
  service_id: string | null;
}

export interface AvailabilitySlotRow {
  id: string;
  pro_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean | null;
}

export interface UserRow {
  id: string;
  role: 'client' | 'professional';
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar?: string | null;
}

export interface UserProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  role: 'client' | 'professional';
  phone?: string | null;
}

export interface ProfessionalNameRow {
  user_id: string;
  professional_name: string;
}

export interface AvailabilityWindowRow {
  start_time: string | null;
  end_time: string | null;
}
