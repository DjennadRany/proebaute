import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Calendar,
  Euro,
  MessageCircle,
  Package,
  Percent,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  countUnreadMessagesForUser,
  fetchBookingsByProfessional,
  fetchProfessionalById,
  fetchProfessionalByUserId,
  fetchServices,
  type ApiBookingSummary,
  type ApiProfessional,
  type ApiReview,
} from '../../api/client';
import { computeProProfileCompletion } from '../../utils/proProfileCompletion';
import { ProDashboardHeader } from '../../components/pro/ProDashboardHeader';
import { StatCard } from '../../components/pro/ProStatCard';
import { TodaySchedule } from '../../components/pro/TodaySchedule';
import { PendingRequestsPanel } from '../../components/pro/PendingRequestsPanel';
import { RecentActivityFeed, type ActivityItem } from '../../components/pro/RecentActivityFeed';
import { QuickActions } from '../../components/pro/QuickActions';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/button';

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRelativeShort(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function sortByTimeSlot(a: ApiBookingSummary, b: ApiBookingSummary) {
  return (a.booking.timeSlot || '').localeCompare(b.booking.timeSlot || '', 'fr');
}

export function ProDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professionalRow, setProfessionalRow] = useState<ApiProfessional | null>(null);
  const [bookings, setBookings] = useState<ApiBookingSummary[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const proRow = await fetchProfessionalByUserId(user._id);
        if (!proRow) {
          if (!cancelled) {
            setProfessionalRow(null);
            setBookings([]);
            setReviews([]);
            setServicesCount(0);
            setUnreadMessages(0);
          }
          return;
        }
        if (!cancelled) setProfessionalRow(proRow);

        const [detail, bookingsRes, services, unread] = await Promise.all([
          fetchProfessionalById(proRow._id),
          fetchBookingsByProfessional(proRow._id),
          fetchServices(proRow._id),
          countUnreadMessagesForUser(user._id).catch(() => 0),
        ]);

        if (cancelled) return;
        setBookings(bookingsRes);
        setReviews(detail.reviews ?? []);
        setServicesCount(services.length);
        setUnreadMessages(unread);
        setProfessionalRow(detail.professional);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Impossible de charger le tableau de bord pour le moment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user._id]);

  const completionPercent = useMemo(
    () => computeProProfileCompletion(professionalRow, servicesCount),
    [professionalRow, servicesCount],
  );

  const today = useMemo(() => new Date(), []);
  const todayBookings = useMemo(() => {
    return bookings
      .filter((b) => sameCalendarDay(new Date(b.booking.bookingDate), today))
      .sort(sortByTimeSlot);
  }, [bookings, today]);

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.booking.status === 'pending'),
    [bookings],
  );

  const upcomingCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return bookings.filter(
      (b) =>
        new Date(b.booking.bookingDate) >= start &&
        (b.booking.status === 'confirmed' || b.booking.status === 'pending'),
    ).length;
  }, [bookings]);

  const estimatedRevenue = useMemo(() => {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    return bookings
      .filter((b) => {
        const d = new Date(b.booking.bookingDate);
        if (d > horizon) return false;
        if (b.booking.status !== 'confirmed' && b.booking.status !== 'pending') return false;
        return d >= dayStart;
      })
      .reduce((sum, b) => sum + (b.booking.amount ?? b.service?.price ?? 0), 0);
  }, [bookings]);

  const ratingAverage = professionalRow?.ratingAverage ?? null;

  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    const sorted = [...bookings].sort(
      (a, b) =>
        new Date(b.booking.bookingDate).getTime() - new Date(a.booking.bookingDate).getTime(),
    );
    sorted.slice(0, 4).forEach((b) => {
      items.push({
        id: `b-${b.booking._id}`,
        label:
          b.booking.status === 'pending'
            ? 'Demande en attente'
            : `Réservation (${b.booking.status})`,
        detail: `${b.service?.title ?? 'Prestation'} · ${b.clientDisplayName ?? 'Client'}`,
        tone: 'booking',
        at: formatRelativeShort(b.booking.bookingDate),
      });
    });
    const sortedReviews = [...reviews].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    sortedReviews.slice(0, 3).forEach((r) => {
      const excerpt = r.comment?.trim()
        ? r.comment.length > 72
          ? `${r.comment.slice(0, 72)}…`
          : r.comment
        : 'Nouvel avis';
      items.push({
        id: `r-${r._id}`,
        label: `Avis ${r.rating}/5`,
        detail: excerpt,
        tone: 'review',
        at: r.createdAt ? formatRelativeShort(r.createdAt) : '—',
      });
    });
    return items.slice(0, 6);
  }, [bookings, reviews]);

  if (!loading && !professionalRow && !error) {
    return (
      <div className="max-w-2xl">
        <EmptyState
          icon={Calendar}
          title="Fiche professionnelle non trouvée"
          description="Votre compte pro n’est pas encore relié à une fiche dans l’annuaire. Reconnectez-vous ou contactez le support si le problème persiste."
          action={
            <Button asChild variant="outline">
              <Link to="/login?role=pro">Retour connexion</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const blockError = error;

  return (
    <div className="mx-auto max-w-6xl">
      <ProDashboardHeader
        firstName={user.firstName}
        completionPercent={completionPercent}
        showSetupCta={completionPercent < 85}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Rendez-vous du jour"
          value={loading ? '—' : todayBookings.length}
          icon={Calendar}
          description="Aujourd’hui"
        />
        <StatCard
          title="Rendez-vous à venir"
          value={loading ? '—' : upcomingCount}
          icon={Calendar}
          description="À partir d’aujourd’hui (30 j.)"
        />
        <StatCard
          title="Demandes en attente"
          value={loading ? '—' : pendingBookings.length}
          icon={TrendingUp}
          description="À traiter en priorité"
        />
        <StatCard
          title="Messages non lus"
          value={loading ? '—' : unreadMessages}
          icon={MessageCircle}
          description="Messagerie"
          onClick={() => navigate('/pro/messages')}
        />
        <StatCard
          title="Note moyenne"
          value={loading ? '—' : ratingAverage != null ? ratingAverage.toFixed(1) : '—'}
          icon={Star}
          description="Réputation"
        />
        <StatCard
          title="Revenu estimé (30 j.)"
          value={loading ? '—' : `${Math.round(estimatedRevenue)} €`}
          icon={Euro}
          description="Créneaux à venir"
        />
        <StatCard
          title="Complétion du profil"
          value={loading ? '—' : `${completionPercent}%`}
          icon={Percent}
          description="Visibilité & confiance"
        />
        <StatCard
          title="Services actifs"
          value={loading ? '—' : servicesCount}
          icon={Package}
          description="Catalogue"
          onClick={() => navigate('/pro/services')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TodaySchedule items={todayBookings} loading={loading} error={blockError} />
        <PendingRequestsPanel items={pendingBookings} loading={loading} error={blockError} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivityFeed items={activityItems} loading={loading} error={blockError} />
        <QuickActions />
      </div>
    </div>
  );
}
