import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Helper: certaines tables ne sont pas encore créées en local.
// Quand Supabase renvoie PGRST205 ("table not in schema cache"),
// on renvoie simplement des listes vides pour ne pas casser l'UI.
function isMissingTableError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as any).code === 'PGRST205';
}

function isRlsOrPermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  if (e.code === '42501' || e.code === 'PGRST301') return true;
  const msg = String(e.message ?? '').toLowerCase();
  return (
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('violates row-level security')
  );
}

// Types alignés avec ton backend
export interface ApiService {
  _id: string;
  professionalId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  media: string[];
  ratingAverage: number;
  likesCount: number;
  reviewsCount: number;
}

export interface ApiProfessional {
  _id: string;
  userId?: string;
  professionalName: string;
  specialty: string;
  bio?: string;
  location: string;
  ratingAverage: number;
  reviewsCount: number;
  verified?: boolean;
  gallery?: string[];
  postalCode?: string | null;
  city?: string | null;
  coordinates?: { lat: number | null; lng: number | null } | null;
}

export interface ApiBookingSummary {
  booking: {
    _id: string;
    clientId: string;
    professionalId: string;
    serviceId: string;
    bookingDate: string;
    timeSlot: string;
    status: string;
    amount?: number;
  };
  service: ApiService | null;
  professional: ApiProfessional | null;
  /** Présent pour les vues pro (réservations entrantes) */
  clientDisplayName?: string;
}

export interface ApiConversation {
  _id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: string | null;
  otherUserId: string | null;
  otherUserName?: string;
  otherUserRole?: 'client' | 'professional';
  otherUserPhone?: string | null;
  archived?: boolean;
  blockedBy?: string[];
  reportedBy?: string[];
}

export interface ApiMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readStatus: boolean;
}

export interface ApiFavorite {
  _id: string;
  targetType: 'service' | 'professional';
  targetId: string;
}

export interface ApiLike {
  _id: string;
  serviceId: string | null;
}

export interface ApiReview {
  _id: string;
  bookingId?: string;
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  rating: number;
  comment: string;
  createdAt: string | null;
  clientName?: string | null;
}

export interface BookingDetailResponse {
  booking: ApiBookingSummary['booking'] & { penaltyApplied?: unknown };
  service: ApiService | null;
  professional: ApiProfessional | null;
}

export interface ApiAvailabilitySlot {
  id: string;
  proId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Auth
export interface ApiUser {
  _id: string;
  role: 'client' | 'professional';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ClientSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  birthDate?: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  bookingPreference: 'home' | 'salon' | 'both';
  beautyFrequency: 'occasionnel' | 'regulier' | 'evenement';
  acceptsHomeVisit: boolean;
  notes?: string;
}

export interface ProfessionalSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  companyName: string;
  siren: string;
  specialty: string;
  bio: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  serviceMode: 'home' | 'salon' | 'both';
  travelRadiusKm: number;
  notes?: string;
}

function toApiUser(profile: {
  id: string;
  role: 'client' | 'professional';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
}): ApiUser {
  return {
    _id: profile.id,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone ?? undefined,
  };
}

async function upsertUserProfile(payload: {
  authId: string;
  role: 'client' | 'professional';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): Promise<ApiUser> {
  const profileRow = {
    id: payload.authId,
    role: payload.role,
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone ?? null,
  };

  const { error } = await supabase
    .from('users')
    .upsert(profileRow, { onConflict: 'id' });

  if (error) throw error;

  return toApiUser({
    id: profileRow.id,
    role: profileRow.role,
    first_name: profileRow.first_name,
    last_name: profileRow.last_name,
    email: profileRow.email,
    phone: profileRow.phone,
  });
}

async function upsertProfessionalProfile(payload: {
  authId: string;
  companyName: string;
  specialty: string;
  bio: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  siren: string;
}): Promise<void> {
  const location = [payload.streetAddress.trim(), `${payload.postalCode.trim()} ${payload.city.trim()}`]
    .filter(Boolean)
    .join(', ');

  const { error } = await supabase.from('professionals').upsert(
    {
      user_id: payload.authId,
      professional_name: payload.companyName.trim(),
      specialty: payload.specialty.trim(),
      bio: payload.bio.trim(),
      address: payload.streetAddress.trim(),
      city: payload.city.trim(),
      postal_code: payload.postalCode.trim(),
      siren: payload.siren.trim(),
      location,
      rating_average: 0,
      reviews_count: 0,
      verified: false,
      gallery: [],
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}

/**
 * Recrée les lignes public.users / public.professionals à partir des métadonnées Auth.
 * Indispensable quand la confirmation email est activée : au signUp il n'y a souvent pas de session,
 * donc les upserts initiaux échouent souvent (RLS) même si auth.users est bien créé.
 */
async function syncAppProfileFromAuthUser(authUser: AuthUser): Promise<void> {
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const roleRaw = String(meta.role ?? 'client').toLowerCase();
  const role: 'client' | 'professional' = roleRaw === 'professional' ? 'professional' : 'client';

  const email = (authUser.email ?? '').trim().toLowerCase();
  if (!email) return;

  const firstName = String(meta.first_name ?? email.split('@')[0] ?? 'Utilisateur').trim();
  const lastName = String(meta.last_name ?? '').trim();
  const phone = meta.phone != null && String(meta.phone).trim() ? String(meta.phone).trim() : undefined;

  await upsertUserProfile({
    authId: authUser.id,
    role,
    firstName,
    lastName,
    email,
    phone,
  });

  if (role !== 'professional') return;

  const companyName = String(meta.company_name ?? '').trim();
  const specialty = String(meta.specialty ?? '').trim();
  const bio = String(meta.bio ?? '').trim();
  const streetAddress = String(meta.street_address ?? '').trim();
  const city = String(meta.city ?? '').trim();
  const postalCode = String(meta.postal_code ?? '').trim();
  const siren = String(meta.siren ?? '').trim();

  if (!companyName || !specialty || !streetAddress || !city || !postalCode || !siren) {
    return;
  }

  await upsertProfessionalProfile({
    authId: authUser.id,
    companyName,
    specialty,
    bio: bio || ' ',
    streetAddress,
    city,
    postalCode,
    siren,
  });
}

export async function login(email: string, password: string): Promise<ApiUser> {
  const {
    data: authData,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    if (error) {
      const err = error as { message?: string; code?: string };
      const m = (err.message ?? '').toLowerCase();
      if (
        err.code === 'invalid_credentials' ||
        m.includes('invalid login') ||
        m.includes('invalid_grant') ||
        m.includes('email not confirmed')
      ) {
        throw new Error(
          'Email ou mot de passe incorrect. Si vous venez de créer votre compte, vérifiez votre boîte mail pour confirmer votre adresse.',
        );
      }
      if (m.includes('too many requests') || err.code === 'over_request_rate_limit') {
        throw new Error('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.');
      }
    }
    throw new Error('Connexion impossible. Vérifiez votre connexion internet et réessayez.');
  }

  const authUser = authData.user;

  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    try {
      await syncAppProfileFromAuthUser(authUser);
    } catch (e) {
      if (isRlsOrPermissionError(e)) {
        throw new Error(
          "Supabase refuse l'ecriture sur public.users / public.professionals (RLS). Ouvrez le fichier scripts/supabase-rls-users-professionals.sql dans le dashboard Supabase, executez-le, puis reconnectez-vous.",
        );
      }
      throw e;
    }
    const again = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
    profile = again.data;
    if (again.error) throw again.error;
  }

  if (!profile) {
    throw new Error('User profile not found');
  }

  if (profile.role === 'professional') {
    const { data: proRow } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (!proRow) {
      try {
        await syncAppProfileFromAuthUser(authUser);
      } catch (e) {
        if (isRlsOrPermissionError(e)) {
          throw new Error(
            "Supabase refuse l'écriture sur public.professionals (RLS). Exécutez scripts/supabase-rls-users-professionals.sql dans Supabase, puis reconnectez-vous.",
          );
        }
        throw e;
      }
    }
  }

  return toApiUser({
    id: profile.id,
    role: profile.role as 'client' | 'professional',
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone ?? undefined,
  });
}

export async function signUpClientAccount(payload: ClientSignupPayload): Promise<{
  user: ApiUser | null;
  requiresEmailConfirmation: boolean;
}> {
  const email = payload.email.trim().toLowerCase();
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const phone = payload.phone?.trim() || undefined;

  const appUrl = import.meta.env.VITE_APP_URL || 'https://locbeaute.com';
  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      emailRedirectTo: `${appUrl}/email-confirmed`,
      data: {
        role: 'client',
        first_name: firstName,
        last_name: lastName,
        phone,
        birth_date: payload.birthDate || null,
        city: payload.city.trim(),
        postal_code: payload.postalCode.trim(),
        street_address: payload.streetAddress.trim(),
        booking_preference: payload.bookingPreference,
        beauty_frequency: payload.beautyFrequency,
        accepts_home_visit: payload.acceptsHomeVisit,
        notes: payload.notes?.trim() || null,
        onboarding_completed: true,
      },
    },
  });

  if (error || !data.user) {
    throw error ?? new Error('Impossible de créer le compte');
  }

  let apiUser: ApiUser = {
    _id: data.user.id,
    role: 'client',
    firstName,
    lastName,
    email,
    phone,
  };

  const syncClientUserRow = async () => {
    try {
      apiUser = await upsertUserProfile({
        authId: data.user!.id,
        role: 'client',
        firstName,
        lastName,
        email,
        phone,
      });
    } catch (profileError) {
      console.warn(
        'Profil public.users — échec (souvent RLS). Voir scripts/supabase-rls-users-professionals.sql',
        profileError,
      );
    }
  };

  if (data.session) {
    await syncClientUserRow();
    return { user: apiUser, requiresEmailConfirmation: false };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (!signInError) {
    await syncClientUserRow();
    return { user: apiUser, requiresEmailConfirmation: false };
  }

  if (import.meta.env.DEV) {
    console.info(
      '[Client signup] Pas de session : la ligne public.users sera créée au premier login (sync Auth).',
    );
  }

  return { user: null, requiresEmailConfirmation: true };
}

export async function signUpProfessionalAccount(payload: ProfessionalSignupPayload): Promise<{
  user: ApiUser | null;
  requiresEmailConfirmation: boolean;
}> {
  const email = payload.email.trim().toLowerCase();
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const phone = payload.phone?.trim() || undefined;

  const appUrlPro = import.meta.env.VITE_APP_URL || 'https://locbeaute.com';
  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      emailRedirectTo: `${appUrlPro}/email-confirmed`,
      data: {
        role: 'professional',
        first_name: firstName,
        last_name: lastName,
        phone,
        company_name: payload.companyName.trim(),
        siren: payload.siren.trim(),
        specialty: payload.specialty.trim(),
        bio: payload.bio.trim(),
        street_address: payload.streetAddress.trim(),
        city: payload.city.trim(),
        postal_code: payload.postalCode.trim(),
        service_mode: payload.serviceMode,
        travel_radius_km: payload.travelRadiusKm,
        notes: payload.notes?.trim() || null,
        onboarding_completed: true,
      },
    },
  });

  if (error || !data.user) {
    throw error ?? new Error('Impossible de créer le compte professionnel');
  }

  let apiUser: ApiUser = {
    _id: data.user.id,
    role: 'professional',
    firstName,
    lastName,
    email,
    phone,
  };

  const syncProPublicRows = async () => {
    try {
      apiUser = await upsertUserProfile({
        authId: data.user!.id,
        role: 'professional',
        firstName,
        lastName,
        email,
        phone,
      });
    } catch (profileError) {
      console.warn(
        'Profil public.users — échec (souvent RLS). Voir scripts/supabase-rls-users-professionals.sql',
        profileError,
      );
    }
    try {
      await upsertProfessionalProfile({
        authId: data.user!.id,
        companyName: payload.companyName,
        specialty: payload.specialty,
        bio: payload.bio,
        streetAddress: payload.streetAddress,
        city: payload.city,
        postalCode: payload.postalCode,
        siren: payload.siren,
      });
    } catch (professionalError) {
      console.warn(
        'Fiche public.professionals — échec (souvent RLS). Voir scripts/supabase-rls-users-professionals.sql',
        professionalError,
      );
    }
  };

  if (data.session) {
    await syncProPublicRows();
    return { user: apiUser, requiresEmailConfirmation: false };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (!signInError) {
    await syncProPublicRows();
    return { user: apiUser, requiresEmailConfirmation: false };
  }

  if (import.meta.env.DEV) {
    console.info(
      '[Pro signup] Pas de session : public.users / professionals seront remplis au premier login (sync Auth).',
    );
  }

  return { user: null, requiresEmailConfirmation: true };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login?mode=reset`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    redirectTo ? { redirectTo } : undefined,
  );

  if (error) throw error;
}

export async function updateAccountPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export function mapServiceRow(s: Record<string, unknown>): ApiService {
  const row = s as any;
  return {
    _id: row.id,
    professionalId: row.professional_id ?? row.professionalId ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    category: row.category ?? '',
    price: Number(row.price ?? 0),
    duration: Number(row.duration ?? 0),
    media: Array.isArray(row.media) ? row.media : [],
    ratingAverage: Number(row.rating_average ?? row.ratingAverage ?? 0),
    likesCount: Number(row.likes_count ?? row.likesCount ?? 0),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
  };
}

export async function fetchServices(professionalId?: string): Promise<ApiService[]> {
  const baseQuery = supabase.from('services').select('*');
  const { data, error } = professionalId
    ? await baseQuery.eq('professional_id', professionalId)
    : await baseQuery;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data ?? []).map((s: any) => mapServiceRow(s));
}

export async function createProService(payload: {
  professionalId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  media?: string[];
}): Promise<{ serviceId: string }> {
  const { data, error } = await supabase
    .from('services')
    .insert({
      professional_id: payload.professionalId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category.trim(),
      price: payload.price,
      duration: payload.duration,
      media: payload.media && payload.media.length > 0 ? payload.media : [],
      rating_average: 0,
      likes_count: 0,
      reviews_count: 0,
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Impossible de créer le service');
  return { serviceId: data.id as string };
}

export async function updateProService(
  serviceId: string,
  payload: {
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    duration?: number;
    media?: string[];
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (payload.title !== undefined) row.title = payload.title.trim();
  if (payload.description !== undefined) row.description = payload.description.trim();
  if (payload.category !== undefined) row.category = payload.category.trim();
  if (payload.price !== undefined) row.price = payload.price;
  if (payload.duration !== undefined) row.duration = payload.duration;
  if (payload.media !== undefined) row.media = payload.media;

  const { error } = await supabase.from('services').update(row).eq('id', serviceId);
  if (error) throw error;
}

export async function deleteProService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) throw error;
}

export async function fetchServicesByCategory(category: string): Promise<ApiService[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('category', category);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data ?? []).map((s: any) => mapServiceRow(s));
}

export async function fetchServiceDetails(id: string): Promise<{
  service: ApiService;
  professional: ApiProfessional | null;
  reviews: any[];
}> {
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
  if (serviceError || !service) throw serviceError ?? new Error('Service not found');

  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', (service as any).professional_id)
    .single();
  if (proError && proError.code !== 'PGRST116') throw proError;

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('service_id', id);
  if (reviewsError) throw reviewsError;

  return {
    service: mapServiceRow({ ...(service as any), id: (service as any).id }),
    professional: professional
      ? ({
          _id: (professional as any).id,
          userId: (professional as any).user_id,
          professionalName: (professional as any).professional_name,
          specialty: (professional as any).specialty,
          bio: (professional as any).bio,
          location: (professional as any).location,
          ratingAverage: (professional as any).rating_average,
          reviewsCount: (professional as any).reviews_count,
          verified: (professional as any).verified,
          gallery: (professional as any).gallery,
          postalCode: (professional as any).postal_code,
          city: (professional as any).city,
        } as ApiProfessional)
      : null,
    reviews: (reviews ?? []) as any[],
  };
}

// --- Disponibilités récurrentes (availability_slots) + créneaux réservables ---

function formatTimeSlotFromDb(value: string | null | undefined): string {
  if (!value) return '00:00';
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function parseTimeToMinutes(time: string): number {
  const normalized = formatTimeSlotFromDb(time);
  const parts = normalized.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function minutesToHHmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 0 = lundi … 6 = dimanche (aligné avec scripts/supabase-rls-availability-slots.sql) */
function dateToAvailabilityDayOfWeek(date: Date): number {
  const js = date.getDay();
  return (js + 6) % 7;
}

function intervalsOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && a.end > b.start;
}

export async function fetchAvailabilitySlotsByProId(proId: string): Promise<ApiAvailabilitySlot[]> {
  const { data, error } = await supabase
    .from('availability_slots')
    .select('id, pro_id, day_of_week, start_time, end_time, is_active')
    .eq('pro_id', proId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    proId: row.pro_id,
    dayOfWeek: row.day_of_week,
    startTime: formatTimeSlotFromDb(row.start_time),
    endTime: formatTimeSlotFromDb(row.end_time),
    isActive: row.is_active ?? true,
  }));
}

export async function replaceAvailabilitySlotsForPro(
  proId: string,
  slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
): Promise<void> {
  const { error: delError } = await supabase.from('availability_slots').delete().eq('pro_id', proId);
  if (delError) {
    if (isMissingTableError(delError)) return;
    throw delError;
  }

  const rows = slots
    .filter((s) => s.startTime && s.endTime && parseTimeToMinutes(s.startTime) < parseTimeToMinutes(s.endTime))
    .map((s) => ({
      pro_id: proId,
      day_of_week: s.dayOfWeek,
      start_time: `${formatTimeSlotFromDb(s.startTime)}:00`,
      end_time: `${formatTimeSlotFromDb(s.endTime)}:00`,
      is_active: true,
    }));

  if (rows.length === 0) return;

  const { error: insError } = await supabase.from('availability_slots').insert(rows);
  if (insError) throw insError;
}

export async function fetchAvailableBookingTimeSlots(params: {
  professionalId: string;
  bookingDate: string;
  serviceDurationMinutes: number;
}): Promise<string[]> {
  const duration = Math.max(5, Math.floor(params.serviceDurationMinutes || 60));
  const parts = params.bookingDate.split('-').map((x) => parseInt(x, 10));
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!y || !mo || !d) return [];

  const localDate = new Date(y, mo - 1, d);
  const dayOfWeek = dateToAvailabilityDayOfWeek(localDate);

  const { data: slotRows, error: slotErr } = await supabase
    .from('availability_slots')
    .select('start_time, end_time')
    .eq('pro_id', params.professionalId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (slotErr) {
    if (isMissingTableError(slotErr)) return [];
    throw slotErr;
  }

  const windows = (slotRows ?? [])
    .map((row: any) => ({
      start: parseTimeToMinutes(formatTimeSlotFromDb(row.start_time)),
      end: parseTimeToMinutes(formatTimeSlotFromDb(row.end_time)),
    }))
    .filter((w) => w.end > w.start);

  const { data: bookingRows, error: bookErr } = await supabase
    .from('bookings')
    .select('time_slot, status, service_id')
    .eq('professional_id', params.professionalId)
    .eq('booking_date', params.bookingDate)
    .not('status', 'eq', 'cancelled');

  let bookingsData: any[] = [];
  if (bookErr) {
    if (!isMissingTableError(bookErr)) throw bookErr;
  } else {
    bookingsData = bookingRows ?? [];
  }

  const serviceIds = Array.from(
    new Set(bookingsData.map((b: any) => b.service_id).filter(Boolean)),
  ) as string[];

  const durationByServiceId = new Map<string, number>();
  if (serviceIds.length > 0) {
    const { data: svcRows, error: svcErr } = await supabase
      .from('services')
      .select('id, duration')
      .in('id', serviceIds);
    if (!svcErr && svcRows) {
      for (const s of svcRows as any[]) {
        durationByServiceId.set(s.id, Math.max(5, Math.floor(Number(s.duration) || 60)));
      }
    }
  }

  const busy = bookingsData
    .map((b: any) => {
      const dur = durationByServiceId.get(b.service_id) ?? 60;
      const start = parseTimeToMinutes(formatTimeSlotFromDb(b.time_slot));
      return { start, end: start + dur };
    })
    .filter((x) => x.end > x.start)
    .sort((a, b) => a.start - b.start);

  const offered = new Set<string>();

  for (const win of windows) {
    for (let t = win.start; t + duration <= win.end; t += duration) {
      const candidate = { start: t, end: t + duration };
      const clashes = busy.some((b) => intervalsOverlap(candidate, b));
      if (!clashes) offered.add(minutesToHHmm(t));
    }
  }

  return Array.from(offered).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
}

export async function fetchBookingsByClient(clientId: string): Promise<ApiBookingSummary[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      client_id,
      professional_id,
      service_id,
      booking_date,
      time_slot,
      status,
      amount,
      services:service_id (*),
      professionals:professional_id (*)
    `,
    )
    .eq('client_id', clientId);

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    booking: {
      _id: row.id,
      clientId: row.client_id,
      professionalId: row.professional_id,
      serviceId: row.service_id,
      bookingDate: row.booking_date,
      timeSlot: row.time_slot,
      status: row.status,
      amount: row.amount,
    },
    service: row.services ? mapServiceRow(row.services as any) : null,
    professional: row.professionals
      ? ({
          _id: row.professionals.id,
          userId: row.professionals.user_id,
          professionalName: row.professionals.professional_name,
          specialty: row.professionals.specialty,
          bio: row.professionals.bio,
          location: row.professionals.location,
          ratingAverage: row.professionals.rating_average,
          reviewsCount: row.professionals.reviews_count,
          verified: row.professionals.verified,
          gallery: row.professionals.gallery,
          postalCode: row.professionals.postal_code,
          city: row.professionals.city,
        } as ApiProfessional)
      : null,
  }));
}

export async function fetchProfessionalByUserId(userId: string): Promise<ApiProfessional | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  if (!data) return null;

  const p = data as any;
  return {
    _id: p.id,
    userId: p.user_id,
    professionalName: p.professional_name,
    specialty: p.specialty,
    bio: p.bio,
    location: p.location,
    ratingAverage: p.rating_average,
    reviewsCount: p.reviews_count,
    verified: p.verified,
    gallery: p.gallery,
    postalCode: p.postal_code,
    city: p.city,
  } as ApiProfessional;
}

export async function fetchBookingsByProfessional(professionalId: string): Promise<ApiBookingSummary[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      client_id,
      professional_id,
      service_id,
      booking_date,
      time_slot,
      status,
      amount,
      services:service_id (*),
      professionals:professional_id (*)
    `,
    )
    .eq('professional_id', professionalId)
    .order('booking_date', { ascending: true });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  const rows = (data ?? []) as any[];
  const clientIds = Array.from(new Set(rows.map((r) => r.client_id).filter(Boolean)));

  let nameByClientId = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: usersRows, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', clientIds);
    if (!usersError && usersRows) {
      nameByClientId = new Map(
        (usersRows as any[]).map((u) => [
          u.id,
          `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Client',
        ]),
      );
    }
  }

  return rows.map((row: any) => ({
    booking: {
      _id: row.id,
      clientId: row.client_id,
      professionalId: row.professional_id,
      serviceId: row.service_id,
      bookingDate: row.booking_date,
      timeSlot: row.time_slot,
      status: row.status,
      amount: row.amount,
    },
    service: row.services ? mapServiceRow(row.services as any) : null,
    professional: row.professionals
      ? ({
          _id: row.professionals.id,
          userId: row.professionals.user_id,
          professionalName: row.professionals.professional_name,
          specialty: row.professionals.specialty,
          bio: row.professionals.bio,
          location: row.professionals.location,
          ratingAverage: row.professionals.rating_average,
          reviewsCount: row.professionals.reviews_count,
          verified: row.professionals.verified,
          gallery: row.professionals.gallery,
          postalCode: row.professionals.postal_code,
          city: row.professionals.city,
        } as ApiProfessional)
      : null,
    clientDisplayName: nameByClientId.get(row.client_id) ?? 'Client',
  }));
}

export async function countUnreadMessagesForUser(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read_status', false);

  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

export async function createBooking(payload: {
  clientId: string;
  professionalId: string;
  serviceId: string;
  bookingDate: string;
  timeSlot: string;
  amount: number;
  stripePaymentIntentId?: string;
}): Promise<{ bookingId: string }> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      client_id: payload.clientId,
      professional_id: payload.professionalId,
      service_id: payload.serviceId,
      booking_date: payload.bookingDate,
      time_slot: payload.timeSlot,
      amount: payload.amount,
      status: 'pending',
      stripe_payment_intent_id: payload.stripePaymentIntentId ?? null,
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create booking');
  return { bookingId: data.id };
}

export async function updateBooking(bookingId: string, payload: {
  bookingDate: string;
  timeSlot: string;
}): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      booking_date: payload.bookingDate,
      time_slot: payload.timeSlot,
    })
    .eq('id', bookingId);

  if (error) throw error;
}

export async function fetchConversations(userId: string): Promise<ApiConversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participants', [userId]);

  if (error) throw error;

  const rows = (data ?? []) as any[];
  const otherUserIds = Array.from(
    new Set(
      rows
        .flatMap((c) => (c.participants ?? []).filter((participantId: string) => participantId !== userId))
        .filter(Boolean),
    ),
  );

  const profileMap = new Map<
    string,
    {
      id: string;
      first_name: string;
      last_name: string;
      role: 'client' | 'professional';
      phone?: string | null;
    }
  >();
  const professionalNameMap = new Map<string, string>();

  if (otherUserIds.length > 0) {
    const [{ data: profiles }, { data: professionalProfiles }] = await Promise.all([
      supabase
        .from('users')
        .select('id, first_name, last_name, role, phone')
        .in('id', otherUserIds),
      supabase
        .from('professionals')
        .select('user_id, professional_name')
        .in('user_id', otherUserIds),
    ]);

    (profiles ?? []).forEach((profile: any) => {
      profileMap.set(profile.id, profile);
    });

    (professionalProfiles ?? []).forEach((professional: any) => {
      professionalNameMap.set(professional.user_id, professional.professional_name);
    });
  }

  return rows.map((c: any) => {
    const participants = c.participants ?? [];
    const otherUserId =
      participants.find((participantId: string) => participantId !== userId) ?? null;
    const otherProfile = otherUserId ? profileMap.get(otherUserId) : undefined;

    const fallbackName = otherProfile
      ? `${otherProfile.first_name ?? ''} ${otherProfile.last_name ?? ''}`.trim()
      : undefined;
    const otherUserName =
      (otherUserId ? professionalNameMap.get(otherUserId) : undefined) ||
      fallbackName ||
      undefined;

    return {
      _id: c.id,
      participants,
      lastMessage: c.last_message ?? '',
      updatedAt: c.updated_at,
      otherUserId,
      otherUserName,
      otherUserRole: otherProfile?.role,
      otherUserPhone: otherProfile?.phone ?? null,
      archived: c.archived ?? false,
      blockedBy: c.blocked_by ?? [],
      reportedBy: c.reported_by ?? [],
    };
  });
}

export async function createConversation(payload: {
  userId: string;
  otherUserId: string;
}): Promise<{ conversationId: string }> {
  const participants = [payload.userId, payload.otherUserId];
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participants,
      last_message: '',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create conversation');
  return { conversationId: data.id };
}

export async function fetchMessages(conversationId: string): Promise<ApiMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((m: any) => ({
    _id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    createdAt: m.created_at,
    readStatus: m.read_status,
  }));
}

export async function sendMessage(conversationId: string, payload: {
  senderId: string;
  receiverId: string;
  content: string;
}): Promise<{ messageId: string }> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: payload.senderId,
      receiver_id: payload.receiverId,
      content: payload.content,
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Failed to send message');
  return { messageId: data.id };
}

export async function archiveConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ archived: true })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function unarchiveConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ archived: false })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function blockConversationUser(conversationId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('conversations')
    .select('blocked_by')
    .eq('id', conversationId)
    .single();
  if (error) throw error;

  const blocked: string[] = data?.blocked_by ?? [];
  if (!blocked.includes(userId)) blocked.push(userId);

  const { error: updateError } = await supabase
    .from('conversations')
    .update({ blocked_by: blocked })
    .eq('id', conversationId);
  if (updateError) throw updateError;
}

export async function unblockConversationUser(conversationId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('conversations')
    .select('blocked_by')
    .eq('id', conversationId)
    .single();
  if (error) throw error;

  const blocked: string[] = data?.blocked_by ?? [];
  const next = blocked.filter((id) => id !== userId);

  const { error: updateError } = await supabase
    .from('conversations')
    .update({ blocked_by: next })
    .eq('id', conversationId);
  if (updateError) throw updateError;
}

export async function reportConversationUser(conversationId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('conversations')
    .select('reported_by')
    .eq('id', conversationId)
    .single();
  if (error) throw error;

  const reported: string[] = data?.reported_by ?? [];
  if (!reported.includes(userId)) reported.push(userId);

  const { error: updateError } = await supabase
    .from('conversations')
    .update({ reported_by: reported })
    .eq('id', conversationId);
  if (updateError) throw updateError;
}

// Professionals
export async function fetchProfessionals(location?: string, specialty?: string): Promise<ApiProfessional[]> {
  let query = supabase.from('professionals').select('*');
  if (location) query = query.ilike('location', `%${location}%`);
  if (specialty) query = query.eq('specialty', specialty);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data ?? []).map((p: any) => ({
    _id: p.id,
    userId: p.user_id,
    professionalName: p.professional_name,
    specialty: p.specialty,
    bio: p.bio,
    location: p.location,
    ratingAverage: p.rating_average,
    reviewsCount: p.reviews_count,
    verified: p.verified,
    gallery: p.gallery,
    postalCode: p.postal_code,
    city: p.city,
  })) as ApiProfessional[];
}

export async function fetchProfessionalById(id: string): Promise<{
  professional: ApiProfessional;
  services: ApiService[];
  reviews: ApiReview[];
}> {
  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .single();
  if (proError || !professional) throw proError ?? new Error('Professional not found');

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', id);
  if (servicesError) throw servicesError;

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('professional_id', id);
  if (reviewsError) throw reviewsError;

  return {
    professional: {
      _id: (professional as any).id,
      userId: (professional as any).user_id,
      professionalName: (professional as any).professional_name,
      specialty: (professional as any).specialty,
      bio: (professional as any).bio,
      location: (professional as any).location,
      ratingAverage: (professional as any).rating_average,
      reviewsCount: (professional as any).reviews_count,
      verified: (professional as any).verified,
      gallery: (professional as any).gallery,
      postalCode: (professional as any).postal_code,
      city: (professional as any).city,
    } as ApiProfessional,
    services: (services ?? []).map((s: any) => mapServiceRow(s)),
    reviews: (reviews ?? []).map((r: any) => ({ ...r, _id: r.id })) as ApiReview[],
  };
}

// Favorites
export async function fetchFavorites(userId: string): Promise<ApiFavorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data ?? []).map((f: any) => ({
    _id: f.id,
    targetType: f.target_type,
    targetId: f.target_id,
  }));
}

export async function toggleFavorite(payload: {
  userId: string;
  targetId: string;
  targetType: 'service' | 'professional';
}): Promise<{ favorited: boolean }> {
  const { data: existing, error: selectError } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', payload.userId)
    .eq('target_id', payload.targetId)
    .eq('target_type', payload.targetType)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const { error: delError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
    if (delError) throw delError;
    return { favorited: false };
  }

  const { error: insError } = await supabase.from('favorites').insert({
    user_id: payload.userId,
    target_id: payload.targetId,
    target_type: payload.targetType,
  });
  if (insError) throw insError;
  return { favorited: true };
}

export async function toggleLike(userId: string, serviceId: string): Promise<{ liked: boolean }> {
  const { data: existing, error: selectError } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const { error: delError } = await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id);
    if (delError) throw delError;
    const { error: decError } = await supabase.rpc('decrement_service_likes', { p_service_id: serviceId });
    if (decError) console.error(decError);
    return { liked: false };
  }

  const { error: insError } = await supabase.from('likes').insert({
    user_id: userId,
    service_id: serviceId,
  });
  if (insError) throw insError;
  const { error: incError } = await supabase.rpc('increment_service_likes', { p_service_id: serviceId });
  if (incError) console.error(incError);
  return { liked: true };
}

export async function fetchLikes(userId: string): Promise<ApiLike[]> {
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data ?? []).map((l: any) => ({
    _id: l.id,
    serviceId: l.service_id,
  }));
}

// Booking detail & cancel
export async function getBookingDetail(bookingId: string): Promise<BookingDetailResponse> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      client_id,
      professional_id,
      service_id,
      booking_date,
      time_slot,
      status,
      amount,
      penalty_applied,
      services:service_id (*),
      professionals:professional_id (*)
    `,
    )
    .eq('id', bookingId)
    .single();

  if (error || !data) throw error ?? new Error('Booking not found');

  const booking = {
    _id: data.id,
    clientId: data.client_id,
    professionalId: data.professional_id,
    serviceId: data.service_id,
    bookingDate: data.booking_date,
    timeSlot: data.time_slot,
    status: data.status,
    amount: data.amount,
    penaltyApplied: data.penalty_applied,
  };

  const service = data.services ? mapServiceRow(data.services as any) : null;
  const professional = data.professionals
    ? ({
        _id: data.professionals.id,
        userId: data.professionals.user_id,
        professionalName: data.professionals.professional_name,
        specialty: data.professionals.specialty,
        bio: data.professionals.bio,
        location: data.professionals.location,
        ratingAverage: data.professionals.rating_average,
        reviewsCount: data.professionals.reviews_count,
        verified: data.professionals.verified,
        gallery: data.professionals.gallery,
        postalCode: data.professionals.postal_code,
        city: data.professionals.city,
      } as ApiProfessional)
    : null;

  return { booking, service, professional };
}

export async function cancelBooking(bookingId: string): Promise<{ status: string; penaltyApplied?: unknown }> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('status, penalty_applied')
    .single();

  if (error || !data) throw error ?? new Error('Failed to cancel booking');
  return { status: data.status, penaltyApplied: data.penalty_applied };
}

// Reviews
export async function fetchReviewsByClient(clientId: string): Promise<ApiReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('client_id', clientId);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }

  return (data ?? []).map((r: any) => ({
    ...r,
    _id: r.id,
  })) as ApiReview[];
}

export async function createReview(payload: {
  bookingId: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  rating: number;
  comment: string;
}): Promise<{ reviewId: string }> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: payload.bookingId,
      client_id: payload.clientId,
      professional_id: payload.professionalId,
      service_id: payload.serviceId,
      rating: payload.rating,
      comment: payload.comment,
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create review');
  return { reviewId: data.id };
}


// User profile
export async function fetchUserProfile(userId: string): Promise<{
  _id: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('User profile not found');

  return {
    _id: data.id,
    role: data.role,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone ?? undefined,
    avatar: data.avatar ?? undefined,
  };
}

export async function updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }): Promise<unknown> {
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.first_name = data.firstName;
  if (data.lastName !== undefined) payload.last_name = data.lastName;
  if (data.phone !== undefined) payload.phone = data.phone;

  const { data: updated, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!updated) throw new Error('Mise à jour du profil impossible (ligne absente ou RLS).');
  return updated;
}

// Settings
export async function fetchPrivacySettings(userId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('privacy')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data?.privacy as Record<string, unknown>) ?? {};
}

export async function updatePrivacySettings(userId: string, settings: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        privacy: settings,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchNotificationSettings(userId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('notifications')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data?.notifications as Record<string, unknown>) ?? {};
}

export async function updateNotificationSettings(userId: string, settings: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        notifications: settings,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function gdprExport(userId: string): Promise<{ user: unknown }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Profil utilisateur introuvable pour l'export.");
  return { user: data };
}

export async function gdprDeleteAccount(userId: string): Promise<{ deleted: boolean }> {
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
  return { deleted: true };
}

