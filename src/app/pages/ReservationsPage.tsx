import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchBookingsByClient, type ApiBookingSummary } from '../api/client';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mes réservations</h1>
        <p className="text-muted-foreground">
          Consultez et gérez vos rendez-vous
        </p>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Aucune réservation</p>
            <Link to="/services">
              <Button>Découvrir les services</Button>
            </Link>
          </div>
        ) : (
          bookings.map(({ booking, service, professional }) => {
            const safeImage =
              service?.media?.[0] && !service.media[0].includes('via.placeholder.com')
                ? service.media[0]
                : 'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=1200';

            return (
            <div
              key={booking._id}
              className="bg-card rounded-xl border border-border hover:shadow-md overflow-hidden transition-shadow"
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
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(booking.bookingDate)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {booking.timeSlot}
                    </Badge>
                    <Badge
                      variant={
                        booking.status === 'confirmed'
                          ? 'default'
                          : booking.status === 'completed'
                          ? 'secondary'
                          : booking.status === 'cancelled'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {statusLabel[booking.status] ?? booking.status}
                    </Badge>
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
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
