import { Inbox } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiBookingSummary } from '../../api/client';
import { AppCard } from '../AppCard';
import { StatusBadge } from '../StatusBadge';
import { Button } from '../ui/button';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../ui/skeleton';

type PendingRequestsPanelProps = {
  items: ApiBookingSummary[];
  loading: boolean;
  error: string | null;
};

export function PendingRequestsPanel({ items, loading, error }: PendingRequestsPanelProps) {
  if (loading) {
    return (
      <AppCard tone="elevated" className="rounded-2xl border-amber-500/15">
        <Skeleton className="mb-3 h-5 w-40" />
        <Skeleton className="h-14 w-full rounded-xl" />
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
    <AppCard tone="elevated" className="rounded-2xl border-amber-500/20 bg-amber-500/[0.04]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Demandes à traiter</p>
          <p className="text-xs text-muted-foreground">Réservations en attente de votre réponse</p>
        </div>
        {items.length > 0 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Aucune demande en attente"
          description="Les nouvelles demandes de réservation apparaîtront ici en priorité."
        />
      ) : (
        <ul className="space-y-2">
          {items.map(({ booking, service, clientDisplayName }) => (
            <li
              key={booking._id}
              className="flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-background/90 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={booking.status} className="text-[11px]" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(booking.bookingDate).toLocaleDateString('fr-FR')} · {booking.timeSlot}
                  </span>
                </div>
                <p className="truncate text-sm font-medium text-foreground">
                  {service?.title ?? 'Prestation'} · {clientDisplayName ?? 'Client'}
                </p>
              </div>
              <Link to="/pro/bookings" className="shrink-0">
                <Button size="sm" className="w-full sm:w-auto">
                  Traiter
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
