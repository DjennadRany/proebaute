import { supabase } from './supabaseClient';

// Helper: certaines tables ne sont pas encore créées en local.
// Quand Supabase renvoie PGRST205 ("table not in schema cache"),
// on renvoie simplement des listes vides pour ne pas casser l'UI.
function isMissingTableError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as any).code === 'PGRST205';
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

// Auth
export interface ApiUser {
  _id: string;
  role: 'client' | 'professional';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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
    throw error ?? new Error('Authentication failed');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error('User profile not found');
  }

  return {
    _id: profile.id,
    role: profile.role as 'client' | 'professional',
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone ?? undefined,
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
  return (data ?? []).map((s: any) => ({
    ...s,
    _id: s.id,
  })) as ApiService[];
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
  return (data ?? []).map((s: any) => ({
    ...s,
    _id: s.id,
  })) as ApiService[];
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
    service: { ...(service as any), _id: (service as any).id } as ApiService,
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
    service: row.services
      ? ({ ...row.services, _id: row.services.id } as ApiService)
      : null,
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

  return (data ?? []).map((c: any) => ({
    _id: c.id,
    participants: c.participants ?? [],
    lastMessage: c.last_message ?? '',
    updatedAt: c.updated_at,
    otherUserId: null,
    otherUserName: undefined,
    otherUserRole: undefined,
    otherUserPhone: null,
    archived: c.archived ?? false,
    blockedBy: c.blocked_by ?? [],
    reportedBy: c.reported_by ?? [],
  }));
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
    services: (services ?? []).map((s: any) => ({ ...s, _id: s.id })) as ApiService[],
    reviews: (reviews ?? []) as ApiReview[],
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

  const service = data.services
    ? ({ ...data.services, _id: data.services.id } as ApiService)
    : null;
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
    .single();

  if (error || !data) throw error ?? new Error('User profile not found');

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
    .single();

  if (error) throw error;
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
    .single();
  if (error) throw error;
  return { user: data };
}

export async function gdprDeleteAccount(userId: string): Promise<{ deleted: boolean }> {
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
  return { deleted: true };
}

