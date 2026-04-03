import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { getBookingDetail, cancelBooking, updateBooking, type BookingDetailResponse } from '../api/client';
import { AppCard } from '../components/AppCard';
import { BookingSummary } from '../components/BookingSummary';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { openOrCreateConversation } from '../utils/messaging';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    getBookingDetail(id)
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  // initialise les valeurs d'édition quand les données sont chargées
  useEffect(() => {
    if (!data) return;
    const { booking } = data;
    setEditDate(new Date(booking.bookingDate));
    setEditTime(booking.timeSlot);
  }, [data]);

  const handleCancel = () => {
    if (!id || !data) return;
    if (!window.confirm('Confirmer l\'annulation de cette réservation ?')) return;
    setCancelling(true);
    setCancelError(null);
    cancelBooking(id)
      .then(() => {
        setData((prev) =>
          prev ? { ...prev, booking: { ...prev.booking, status: 'cancelled' } } : null
        );
      })
      .catch((e) => setCancelError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setCancelling(false));
  };

  if (loading || !id) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-muted-foreground">
        {loading ? 'Chargement...' : 'ID manquant'}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-muted-foreground mb-4">Réservation introuvable</p>
        <Link to="/reservations">
          <Button>Retour aux réservations</Button>
        </Link>
      </div>
    );
  }

  const { booking, service, professional } = data;
  const formatDate = () =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(booking.bookingDate));

  const canCancel =
    booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero bannière avec image du service + résumé lisible au-dessus */}
      {service && (
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-muted">
          {/* Image principale, un peu plus haute */}
          <div className="h-[260px] sm:h-[300px] md:h-[340px] w-full">
            <img
              src={
                service.media?.[0] && !service.media[0].includes('via.placeholder.com')
                  ? service.media[0]
                  : 'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=1600'
              }
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dégradés de fondu latéraux + léger effet miroir animé */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/40 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background via-background/40 to-transparent" />
            <div className="sheen-light" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
            <div className="flex justify-between items-start gap-3">
              <Link to="/reservations">
                <Button variant="ghost" size="sm" className="bg-black/40 text-white hover:bg-black/60">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <div className="max-w-xl">
              <p className="text-xs text-white/80 mb-1">Service réservé</p>
              <h1 className="text-lg sm:text-2xl font-semibold text-white line-clamp-2 mb-1">
                {service.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 line-clamp-2">
                {professional?.professionalName && `${professional.professionalName} · `}
                {formatDate()} · {booking.timeSlot}
              </p>
            </div>
          </div>
        </div>
      )}

      {!service && (
        <Link to="/reservations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux réservations
          </Button>
        </Link>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={booking.status} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {service?.title ?? 'Réservation'}
          </h1>
          {professional && (
            <p className="text-muted-foreground">
              avec {professional.professionalName}
            </p>
          )}
        </div>

        <div className="p-6 space-y-6">
          <BookingSummary
            title="Résumé de votre rendez-vous"
            serviceName={service?.title ?? null}
            professionalName={professional?.professionalName ?? null}
            location={professional?.location ?? null}
            dateLabel={formatDate()}
            timeLabel={booking.timeSlot}
            durationLabel={service ? `${service.duration} minutes` : null}
            totalLabel={service ? `${booking.amount ?? service.price}€` : null}
          />

          {/* Carte profil coiffeur + itinéraire */}
          {professional && (
            <AppCard tone="elevated" className="mt-4 rounded-2xl space-y-3 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Votre professionnel</p>
                  <p className="font-semibold text-foreground">
                    {professional.professionalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {professional.location}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const q = encodeURIComponent(professional.location || professional.professionalName || '');
                    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                  }}
                >
                  Ouvrir l'itinéraire
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link to={`/professionals/${professional._id}`} className="w-full sm:w-auto">
                  <Button size="sm" variant="ghost" className="w-full sm:w-auto">
                    Voir le profil du professionnel
                  </Button>
                </Link>
                <Link to={`/booking?professionalId=${professional._id}`} className="w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    Réserver un nouveau rendez-vous avec ce professionnel
                  </Button>
                </Link>
              </div>
            </AppCard>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Politique d'annulation :</strong> Annulation gratuite jusqu'à 48h avant le
              rendez-vous. Entre 24h et 48h, une pénalité partielle peut s'appliquer. Au-delà de
              24h avant le rdv, l'annulation peut entraîner des frais.
            </AlertDescription>
          </Alert>

            {cancelError && (
            <Alert variant="destructive">
              <AlertDescription>{cancelError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {canCancel && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Annulation...' : 'Annuler la réservation'}
              </Button>
            )}

            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <Button
                variant="outline"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? 'Fermer la modification' : 'Modifier la réservation'}
              </Button>
            )}

            {user && professional?.userId && (
              <Button
                variant="outline"
                className="sm:ml-auto"
                onClick={async () => {
                  try {
                    const convId = await openOrCreateConversation(user._id, professional.userId!);
                    navigate(`/messages?conversationId=${encodeURIComponent(convId)}`);
                  } catch (e) {
                    console.error('Erreur ouverture conversation', e);
                    // Même en cas d'erreur backend, on renvoie vers la page Messages
                    navigate('/messages');
                  }
                }}
              >
                Contacter le professionnel
              </Button>
            )}
          </div>

          {isEditing && (
            <div className="mt-6 space-y-4 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">
                Modifier la date et l'horaire de votre rendez-vous
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nouvelle date</p>
                  <input
                    type="date"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={editDate ? editDate.toISOString().slice(0, 10) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditDate(v ? new Date(v) : undefined);
                    }}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nouvel horaire</p>
                  <input
                    type="time"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={!editDate || !editTime}
                  onClick={async () => {
                    if (!editDate || !editTime) return;
                    try {
                      const bookingDate = editDate.toISOString().slice(0, 10);
                      await updateBooking(booking._id, {
                        bookingDate,
                        timeSlot: editTime,
                      });
                      setData((prev) =>
                        prev
                          ? {
                              ...prev,
                              booking: {
                                ...prev.booking,
                                bookingDate,
                                timeSlot: editTime,
                              },
                            }
                          : prev,
                      );
                      setIsEditing(false);
                    } catch (e) {
                      console.error('Erreur mise à jour réservation', e);
                      window.alert('Impossible de modifier la réservation pour le moment.');
                    }
                  }}
                >
                  Enregistrer les modifications
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setIsEditing(false);
                    setEditDate(new Date(booking.bookingDate));
                    setEditTime(booking.timeSlot);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton contact désormais aligné avec les autres actions juste au-dessus */}
    </div>
  );
}
