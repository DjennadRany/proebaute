import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchBookingsByProfessional,
  fetchProfessionalByUserId,
  type ApiBookingSummary,
} from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { ListItemCard } from '../../components/ListItemCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Skeleton } from '../../components/ui/skeleton';

const statusLabel: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
  declined: 'Refusé',
};

export function ProBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ApiBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pro = await fetchProfessionalByUserId(user._id);
        if (!pro || cancelled) {
          if (!cancelled) setBookings([]);
          return;
        }
        const list = await fetchBookingsByProfessional(pro._id);
        if (!cancelled) setBookings(list);
      } catch (e) {
        console.error(e);
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user._id]);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AppHeader
        eyebrow="Activité"
        title="Réservations clients"
        subtitle="Suivez les demandes entrantes et le statut de chaque rendez-vous."
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucune réservation"
          description="Les demandes de vos clientes apparaîtront ici dès les premières réservations."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map(({ booking, service, clientDisplayName }) => {
            const safeImage =
              service?.media?.[0] && !service.media[0].includes('via.placeholder.com')
                ? service.media[0]
                : 'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=1200';
            return (
              <ListItemCard key={booking._id} actionable className="overflow-hidden rounded-2xl p-0">
                {service && (
                  <div className="h-40 w-full sm:h-44">
                    <img src={safeImage} alt={service.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-medium text-foreground">
                        {formatDate(booking.bookingDate)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Clock className="mr-1 inline h-3.5 w-3.5" />
                        {booking.timeSlot}
                      </span>
                      <StatusBadge status={booking.status} className="text-[11px]" />
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground">{service?.title ?? 'Prestation'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {clientDisplayName ?? 'Cliente'} ·{' '}
                      {statusLabel[booking.status] ?? booking.status}
                    </p>
                  </div>
                </div>
              </ListItemCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
