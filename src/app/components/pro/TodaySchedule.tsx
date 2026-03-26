import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiBookingSummary } from '../../api/client';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { Button } from '../ui/button';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../ui/skeleton';

type TodayScheduleProps = {
  items: ApiBookingSummary[];
  loading: boolean;
  error: string | null;
};

export function TodaySchedule({ items, loading, error }: TodayScheduleProps) {
  if (loading) {
    return (
      <AppCard tone="elevated" className="rounded-2xl">
        <p className="mb-4 text-sm font-semibold text-foreground">Agenda du jour</p>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard tone="elevated" className="rounded-2xl border-destructive/30">
        <p className="text-sm text-destructive">{error}</p>
      </AppCard>
    );
  }

  return (
    <AppCard tone="elevated" className="rounded-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Agenda du jour</p>
          <p className="text-xs text-muted-foreground">Prochains créneaux confirmés ou en attente</p>
        </div>
        <Link to="/pro/bookings">
          <Button variant="ghost" size="sm">
            Tout voir
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucun rendez-vous aujourd’hui"
          description="Les réservations du jour apparaîtront ici."
        />
      ) : (
        <ul className="space-y-3">
          {items.map(({ booking, service, clientDisplayName }) => (
            <li
              key={booking._id}
              className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={booking.status} className="text-[11px]" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {booking.timeSlot}
                  </span>
                </div>
                <p className="truncate font-medium text-foreground">
                  {service?.title ?? 'Prestation'}
                </p>
                <p className="text-xs text-muted-foreground">{clientDisplayName ?? 'Client'}</p>
              </div>
              <Link to={`/pro/bookings`} className="shrink-0">
                <Button variant="outline" size="sm">
                  Détails
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}