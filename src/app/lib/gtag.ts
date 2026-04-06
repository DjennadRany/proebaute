export const GA_ID = 'G-VKJ1PSH0FD';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const pageview = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, {
    page_path: url,
  });
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};

// === ÉVÉNEMENTS PERSONNALISÉS LOCBEAUTÉ ===

// 1. INSCRIPTIONS
export const trackSignup = (userType: 'client' | 'professional', method: 'email' | 'social') => {
  event({
    action: 'signup',
    category: 'engagement',
    label: `${userType}_${method}`,
  });
};

// 2. CONNEXIONS
export const trackLogin = (userType: 'client' | 'professional', method: 'email' | 'social') => {
  event({
    action: 'login',
    category: 'engagement',
    label: `${userType}_${method}`,
  });
};

// 3. RÉSERVATIONS
export const trackBookingStart = (serviceId: string, serviceName: string) => {
  event({
    action: 'begin_checkout',
    category: 'ecommerce',
    label: serviceName,
    value: undefined, // Prix à ajouter si disponible
  });
};

export const trackBookingComplete = (bookingId: string, serviceName: string, price: number) => {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: serviceName,
    value: price,
  });
};

export const trackBookingCancel = (bookingId: string, reason?: string) => {
  event({
    action: 'booking_cancel',
    category: 'ecommerce',
    label: reason || 'user_cancel',
  });
};

// 4. MESSAGES
export const trackMessageSent = (recipientType: 'professional' | 'client', messageType: 'text' | 'image') => {
  event({
    action: 'message_sent',
    category: 'engagement',
    label: `${recipientType}_${messageType}`,
  });
};

// 5. PROFILS PROFESSIONNELS
export const trackProfileView = (professionalId: string, source: 'search' | 'map' | 'booking') => {
  event({
    action: 'professional_view',
    category: 'engagement',
    label: `${professionalId}_${source}`,
  });
};

export const trackServiceView = (serviceId: string, source: 'home' | 'search' | 'professional') => {
  event({
    action: 'service_view',
    category: 'engagement',
    label: `${serviceId}_${source}`,
  });
};

// 6. FAVORIS
export const trackFavoriteAdd = (itemType: 'professional' | 'service', itemId: string) => {
  event({
    action: 'favorite_add',
    category: 'engagement',
    label: `${itemType}_${itemId}`,
  });
};

export const trackFavoriteRemove = (itemType: 'professional' | 'service', itemId: string) => {
  event({
    action: 'favorite_remove',
    category: 'engagement',
    label: `${itemType}_${itemId}`,
  });
};

// 7. AVIS
export const trackReviewSubmit = (rating: number, itemType: 'professional' | 'service') => {
  event({
    action: 'review_submit',
    category: 'engagement',
    label: `${itemType}_${rating}stars`,
    value: rating,
  });
};

// 8. PAIEMENTS
export const trackPaymentStart = (amount: number, method: string) => {
  event({
    action: 'payment_start',
    category: 'ecommerce',
    label: method,
    value: amount,
  });
};

export const trackPaymentSuccess = (amount: number, method: string, bookingId: string) => {
  event({
    action: 'payment_success',
    category: 'ecommerce',
    label: `${method}_${bookingId}`,
    value: amount,
  });
};

export const trackPaymentFail = (amount: number, method: string, error: string) => {
  event({
    action: 'payment_fail',
    category: 'ecommerce',
    label: `${method}_${error}`,
    value: amount,
  });
};

// 9. NAVIGATION ET ENGAGEMENT
export const trackSearch = (query: string, resultsCount: number, category?: string) => {
  event({
    action: 'search',
    category: 'engagement',
    label: category || 'general',
    value: resultsCount,
  });
};

export const trackFilterApply = (filterType: string, filterValue: string) => {
  event({
    action: 'filter_apply',
    category: 'engagement',
    label: `${filterType}_${filterValue}`,
  });
};

export const trackMapInteraction = (action: 'zoom' | 'pan' | 'marker_click', details?: string) => {
  event({
    action: 'map_interaction',
    category: 'engagement',
    label: `${action}_${details || 'general'}`,
  });
};

// 10. NOTIFICATIONS
export const trackNotificationClick = (type: 'booking' | 'message' | 'review' | 'system') => {
  event({
    action: 'notification_click',
    category: 'engagement',
    label: type,
  });
};

// 11. PROFIL UTILISATEUR
export const trackProfileUpdate = (field: string) => {
  event({
    action: 'profile_update',
    category: 'engagement',
    label: field,
  });
};

// 12. TEMPS SUR PAGE (AUTO-TRACKING VIA PAGEVIEW)
export const trackTimeOnPage = (page: string, timeInSeconds: number) => {
  event({
    action: 'time_on_page',
    category: 'engagement',
    label: page,
    value: timeInSeconds,
  });
};

// 13. ERREURS
export const trackError = (errorType: string, errorMessage: string, page: string) => {
  event({
    action: 'error',
    category: 'technical',
    label: `${errorType}_${page}`,
  });
};

// 14. PARTAGE SOCIAL
export const trackShare = (platform: 'facebook' | 'twitter' | 'whatsapp' | 'other', contentType: string) => {
  event({
    action: 'share',
    category: 'social',
    label: `${platform}_${contentType}`,
  });
};

// 15. GLAMFEED (RÉSEAU SOCIAL)
export const trackPostView = (postId: string, authorType: 'professional' | 'client') => {
  event({
    action: 'post_view',
    category: 'social',
    label: `${authorType}_${postId}`,
  });
};

export const trackPostLike = (postId: string) => {
  event({
    action: 'post_like',
    category: 'social',
    label: postId,
  });
};

export const trackPostComment = (postId: string) => {
  event({
    action: 'post_comment',
    category: 'social',
    label: postId,
  });
};

export const trackPostShare = (postId: string, platform: string) => {
  event({
    action: 'post_share',
    category: 'social',
    label: `${postId}_${platform}`,
  });
};

// 16. WALLET PROFESSIONNEL
export const trackWalletView = (professionalId: string) => {
  event({
    action: 'wallet_view',
    category: 'business',
    label: professionalId,
  });
};

export const trackPayoutRequest = (amount: number, method: string) => {
  event({
    action: 'payout_request',
    category: 'business',
    label: method,
    value: amount,
  });
};

// 17. SUPPORT ET CONTACT
export const trackContactForm = (subject: string) => {
  event({
    action: 'contact_form',
    category: 'support',
    label: subject,
  });
};

export const trackHelpClick = (topic: string) => {
  event({
    action: 'help_click',
    category: 'support',
    label: topic,
  });
};

// 18. PERFORMANCE TECHNIQUE
export const trackPerformance = (metric: 'page_load' | 'api_response', value: number, page: string) => {
  event({
    action: 'performance',
    category: 'technical',
    label: `${metric}_${page}`,
    value,
  });
};

// 19. ABANDON DE PANIER
export const trackCartAbandon = (step: string, serviceId: string) => {
  event({
    action: 'cart_abandon',
    category: 'ecommerce',
    label: `${step}_${serviceId}`,
  });
};

// 20. CONVERSION FUNNEL
export const trackFunnelStep = (step: 'signup_start' | 'signup_complete' | 'first_booking' | 'repeat_customer', userType: 'client' | 'professional') => {
  event({
    action: 'funnel_step',
    category: 'conversion',
    label: `${step}_${userType}`,
  });
};
