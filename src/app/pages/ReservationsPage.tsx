import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ListItemCard } from '../components/ListItemCard';
import { StatusBadge } from '../components/StatusBadge';
import { fetchBookingsByClient, type ApiBookingSummary } from '../api/client';
import { Button } from '../components/ui/button';

export function ReservationsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ApiBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingsByClient(user._id)
      .then(setBookings)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user._id]);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));

  const statusLabel: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    completed: 'Terminé',
    declined: 'Refusé',
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-16">
        <p className="text-muted-foreground">Chargement des réservations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AppHeader
        eyebrow="Activité"
        title="Mes réservations"
        subtitle="Retrouvez vos prochains rendez-vous, leur statut et les actions utiles en un coup d'œil."
      />

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Aucune réservation pour le moment"
            description="Explorez les services, trouvez votre prochain professionnel et revenez ici pour suivre vos rendez-vous."
            action={
              <Link to="/services">
                <Button>Découvrir les services</Button>
              </Link>
            }
          />
        ) : (
          bookings.map(({ booking, service, professional }) => {
            const safeImage =
              service?.media?.[0] && !service.media[0].includes('via.placeholder.com')
                ? service.media[0]
                : 'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=1200';

            return (
            <ListItemCard
              key={booking._id}
              actionable
              className="overflow-hidden rounded-2xl p-0"
            >
              {service && (
                <div className="w-full h-40 sm:h-44 md:h-48">
                  <img
                    src={safeImage}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-medium text-foreground">
                      {formatDate(booking.bookingDate)}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {booking.timeSlot}
                    </span>
                    <StatusBadge status={booking.status} className="text-[11px]" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {service?.title ?? 'Service'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    avec {professional?.professionalName ?? '—'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service?.duration ?? '—'} min
                    </span>
                    {booking.amount != null && (
                      <span className="font-medium text-foreground">{booking.amount}€</span>
                    )}
                  </div>
                </div>
                {booking.status !== 'cancelled' && booking.status !== 'declined' && (
                  <Link to={`/reservations/${booking._id}`} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full px-4 sm:w-auto"
                    >
                      Plus de détails
                    </Button>
                  </Link>
                )}
              </div>
            </ListItemCard>
            );
          })
        )}
      </div>
    </div>
  );
}
