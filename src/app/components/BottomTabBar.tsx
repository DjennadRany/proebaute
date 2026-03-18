import {
  Bell,
  Calendar,
  Home,
  MessageCircle,
  User,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from './ui/utils';

const primaryItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/reservations', label: 'Activité', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/notifications', label: 'Alertes', icon: Bell },
  { href: '/profile', label: 'Profil', icon: User },
];

export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 w-full max-w-full border-t border-white/10 bg-slate-950/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {primaryItems.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition',
                isActive
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

