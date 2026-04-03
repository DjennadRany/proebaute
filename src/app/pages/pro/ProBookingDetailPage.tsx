import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import {
  getBookingDetail,
  type BookingDetailResponse,
} from '../../api/client';

type ProBookingDetail = BookingDetailResponse & { clientDisplayName?: string };
import { supabase } from '../../api/supabaseClient';
import { AppCard } from '../../components/AppCard';
import { BookingSummary } from '../../components/BookingSummary';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';

export function ProBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBookingDetail(id)
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: 'confirmed' | 'completed' | 'declined') => {
    if (!id || !data) return;
    setActionPending(true);
    setActionError(null);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      setData((prev) =>
        prev ? { ...prev, booking: { ...prev.booking, status: newStatus } } : null
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setActionPending(false);
    }
  };

  const handleConfirm = () => {
    if (!window.confirm('Confirmer cette reservation ?')) return;
    updateStatus('confirmed');
  };

  const handleComplete = () => {
    if (!window.confirm('Marquer cette reservation comme terminee ?')) return;
    updateStatus('completed');
  };

  const handleDecline = () => {
    if (!window.confirm('Refuser cette reservation ?')) return;
    updateStatus('declined');
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
        <p className="text-muted-foreground mb-4">Reservation introuvable</p>
        <Link to="/pro/bookings">
          <Button>Retour aux reservations</Button>
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

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/pro/bookings">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux reservations
        </Button>
      </Link>

      {service && (
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-muted">
          <div className="h-[220px] sm:h-[260px] w-full">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 sm:p-6">
            <h1 className="text-lg sm:text-2xl font-semibold text-white line-clamp-2 mb-1">
              {service.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/80">
              {formatDate()} · {booking.timeSlot}
            </p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={booking.status} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {service?.title ?? 'Reservation'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Client info */}
          <AppCard tone="elevated" className="rounded-2xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-1">Cliente</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {data.clientDisplayName ?? 'Cliente'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{booking.timeSlot}</span>
            </div>
          </AppCard>

          <BookingSummary
            title="Resume du rendez-vous"
            serviceName={service?.title ?? null}
            professionalName={professional?.professionalName ?? null}
            location={professional?.location ?? null}
            dateLabel={formatDate()}
            timeLabel={booking.timeSlot}
            durationLabel={service ? `${service.duration} minutes` : null}
            totalLabel={service ? `${booking.amount ?? service.price}\u20AC` : null}
          />

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Confirmez la reservation pour la valider aupres de votre cliente. Marquez-la comme
              terminee apres la prestation pour mettre a jour votre historique.
            </AlertDescription>
          </Alert>

          {actionError && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {booking.status === 'pending' && (
              <>
                <Button
                  onClick={handleConfirm}
                  disabled={actionPending}
                  className="w-full sm:w-auto"
                >
                  {actionPending ? 'En cours...' : 'Confirmer la reservation'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDecline}
                  disabled={actionPending}
                  className="w-full sm:w-auto"
                >
                  Refuser
                </Button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <Button
                onClick={handleComplete}
                disabled={actionPending}
                className="w-full sm:w-auto"
              >
                {actionPending ? 'En cours...' : 'Marquer comme terminee'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
