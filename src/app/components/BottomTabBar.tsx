import { useEffect, useState } from 'react';
import {
  Bell,
  Home,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { countUnreadMessagesForUser } from '../api/client';
import { supabase } from '../api/supabaseClient';
import { cn } from './ui/utils';

const primaryItems = [
  { href: '/dashboard', label: 'Accueil', icon: Home },
  { href: '/map', label: 'MapBeaute', icon: MapPin },
  { href: '/glamfeed', label: 'GlamFeed', icon: Sparkles },
  { href: '/notifications', label: 'Alertes', icon: Bell, badge: true },
  { href: '/messages', label: 'Chat', icon: MessageCircle, badge: true },
];

export function BottomTabBar() {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadCounts = async () => {
      try {
        const msgCount = await countUnreadMessagesForUser(user._id);
        setUnreadMessages(msgCount);

        // Alertes = réservations récentes (pending/confirmed dans les 48h)
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, status, created_at')
          .eq('client_id', user._id)
          .in('status', ['confirmed', 'pending'])
          .gte('created_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString());
        setUnreadAlerts((bookings ?? []).length);
      } catch { /* ignore */ }
    };

    loadCounts();

    // Realtime: badge messages live
    const channel = supabase
      .channel('bottombar:' + user._id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        setUnreadMessages((c) => c + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `client_id=eq.${user._id}` }, () => {
        loadCounts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?._id]);

  // Reset badge messages quand on ouvre messages
  useEffect(() => {
    if (location.pathname.startsWith('/messages')) setUnreadMessages(0);
    if (location.pathname.startsWith('/notifications')) setUnreadAlerts(0);
  }, [location.pathname]);

  if (user?.role === 'professional') {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full max-w-full border-t border-white/10 bg-slate-950/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 backdrop-blur shadow-[0_-12px_24px_rgba(15,23,42,0.55)] md:hidden">
      <div className="mx-auto grid w-full max-w-lg grid-cols-5 gap-1">
        {primaryItems.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          const count = item.href === '/messages' ? unreadMessages : item.href === '/notifications' ? unreadAlerts : 0;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'relative min-w-0 flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition duration-150 ease-out',
                isActive
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <Icon className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              <span className="truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

