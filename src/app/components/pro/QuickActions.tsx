import { Link } from 'react-router';
import {
  CalendarClock,
  CalendarRange,
  PlusCircle,
  UserRound,
} from 'lucide-react';
import { AppCard } from '../AppCard';

const actions = [
  {
    to: '/pro/services',
    title: 'Ajouter un service',
    description: 'Élargir votre catalogue',
    icon: PlusCircle,
  },
  {
    to: '/pro/availability',
    title: 'Disponibilités',
    description: 'Ajuster vos créneaux',
    icon: CalendarRange,
  },
  {
    to: '/pro/profile',
    title: 'Modifier le profil',
    description: 'Bio, photos, zone',
    icon: UserRound,
  },
  {
    to: '/pro/bookings',
    title: 'Réservations',
    description: 'Voir le planning',
    icon: CalendarClock,
  },
] as const;

export function QuickActions() {
  return (
    <AppCard tone="elevated" className="rounded-2xl">
      <p className="mb-4 text-sm font-semibold text-foreground">Actions rapides</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-3 rounded-xl border border-border/80 bg-background/80 p-4 transition hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppCard>
  );
}
