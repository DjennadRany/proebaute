/**
 * useNotifications
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * 1. Enregistre le service worker (public/sw.js)
 * 2. Demande la permission browser notification
 * 3. Ã‰coute Supabase Realtime pour messages + bookings
 * 4. Affiche une browser Notification quand la page est en arriÃ¨re-plan
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';

type NotificationUser = {
  _id: string;
  firstName: string;
  role: 'client' | 'professional';
};

function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function showBrowserNotif(title: string, body: string, url = '/') {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        url,
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  } catch (_) {
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}

export function useNotifications(user: NotificationUser | null) {
  const registered = useRef(false);

  // Enregistrement SW
  useEffect(() => {
    if (registered.current || !('serviceWorker' in navigator)) return;
    registered.current = true;
    navigator.serviceWorker.register('/sw.js').catch(() => {/* fail silently */});
  }, []);

  // Demander permission
  useEffect(() => {
    if (!user) return;
    if (!isNotificationSupported()) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user?._id]);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Nouveaux messages â†’ notification si page en background
    const msgChannel = supabase
      .channel('notif:messages:' + user._id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const row = payload.new as any;
        if (row.sender_id === user._id) return;
        if (document.hidden) {
          showBrowserNotif(
            'Nouveau message',
            row.content?.slice(0, 80) ?? 'Vous avez un nouveau message',
            '/messages'
          );
        }
      })
      .subscribe();
    channels.push(msgChannel);

    // RÃ©servation confirmÃ©e/annulÃ©e
    const bookingChannel = supabase
      .channel('notif:bookings:' + user._id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `client_id=eq.${user._id}`,
      }, (payload) => {
        const row = payload.new as any;
        const old = payload.old as any;
        if (row.status === old.status) return;

        const statusMessages: Record<string, string> = {
          confirmed: 'Votre rÃ©servation a Ã©tÃ© confirmÃ©e ! âœ…',
          cancelled: 'Votre rÃ©servation a Ã©tÃ© annulÃ©e.',
          completed: 'Prestation terminÃ©e â€” laissez un avis ! â­',
        };
        const body = statusMessages[row.status];
        if (body && document.hidden) {
          showBrowserNotif('LocBeautÃ©', body, '/reservations/' + row.id);
        }
      })
      .subscribe();
    channels.push(bookingChannel);

    // Pro : nouvelles rÃ©servations entrantes
    if (user.role === 'professional') {
      const proBookingChannel = supabase
        .channel('notif:pro:bookings:' + user._id)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        }, () => {
          if (document.hidden) {
            showBrowserNotif('LocBeautÃ©', 'Nouvelle demande de rÃ©servation ! ðŸŽ‰', '/pro/bookings');
          }
        })
        .subscribe();
      channels.push(proBookingChannel);
    }

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [user?._id, user?.role]);
}

