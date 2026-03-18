import { useEffect, useState } from 'react';
import { Bell, Calendar, Heart, MessageCircle, Sparkles, Star, TrendingUp, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { EntityAvatar } from '../components/EntityAvatar';
import { StatCard } from '../components/StatCard';
import { ServiceCard } from '../components/ServiceCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import {
  ApiBookingSummary,
  ApiService,
  fetchBookingsByClient,
  fetchServices,
  fetchFavorites,
  fetchConversations,
  fetchReviewsByClient,
  fetchLikes,
  toggleFavorite,
  toggleLike,
} from '../api/client';
import { openOrCreateConversation } from '../utils/messaging';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingBookings, setUpcomingBookings] = useState<ApiBookingSummary[]>([]);
  const [recentServices, setRecentServices] = useState<ApiService[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [conversationsCount, setConversationsCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const nextBooking = upcomingBookings[0] ?? null;

  useEffect(() => {
    async function loadData() {
      try {
        const [services, bookings, favorites, likes, conversations, reviews] = await Promise.all([
          fetchServices(),
          fetchBookingsByClient(user._id),
          fetchFavorites(user._id).catch(() => []),
          fetchLikes(user._id).catch(() => []),
          fetchConversations(user._id).catch(() => []),
          fetchReviewsByClient(user._id).catch(() => []),
        ]);

        setRecentServices(services.slice(0, 4));
        setFavoritesCount(favorites.length);
        setFavoriteIds(
          new Set(favorites.filter((f) => f.targetType === 'service').map((f) => f.targetId))
        );
        setLikedIds(
          new Set(likes.map((l) => l.serviceId).filter((id): id is string => Boolean(id)))
        );
        setConversationsCount(conversations.length);
        setReviewsCount(reviews.length);

        const confirmed = bookings.filter((b) => b.booking.status === 'confirmed');
        setUpcomingBookings(confirmed);
      } catch (e) {
        console.error('Erreur chargement dashboard', e);
      }
    }

    if (user) loadData();
  }, [user?._id]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <AppHeader
        eyebrow="Votre espace"
        title={`Bonjour, ${user.firstName}`}
        subtitle="Gardez une vue instantanée sur votre activité du jour, vos réservations et vos services favoris."
        action={
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/notifications')}>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
          </div>
        }
      />

      <AppCard tone="premium" className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="flex items-start gap-4">
          <EntityAvatar
            name={`${user.firstName} ${user.lastName}`}
            size="lg"
          />
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Tableau de bord
              </p>
              <StatusBadge status="online" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Votre activité beauté en un coup d’œil
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Consultez vos prochains rendez-vous, vos conversations et les services que vous suivez de près.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Prochain rendez-vous</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {nextBooking?.service?.title ?? 'Aucun rendez-vous confirmé'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextBooking
                ? `${new Date(nextBooking.booking.bookingDate).toLocaleDateString('fr-FR')} à ${nextBooking.booking.timeSlot}`
                : 'Réservez votre prochaine prestation en quelques clics.'}
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Favoris actifs</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{favoritesCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Services sauvegardés pour vos prochaines réservations.</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Conversations</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{conversationsCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Professionnels avec qui vous êtes déjà en contact.</p>
          </div>
        </div>
      </AppCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Réservations à venir"
          value={upcomingBookings.length}
          icon={Calendar}
          description="Prochaines séances"
          onClick={() => navigate('/reservations')}
        />
        <StatCard
          title="Services favoris"
          value={favoritesCount}
          icon={Heart}
          description="Services sauvegardés"
          onClick={() => navigate('/favorites')}
        />
        <StatCard
          title="Messages"
          value={conversationsCount}
          icon={MessageCircle}
          description={conversationsCount > 0 ? 'Conversations' : 'Aucun message'}
          onClick={() => navigate('/messages')}
        />
        <StatCard
          title="Avis donnés"
          value={reviewsCount}
          icon={Star}
          description="Cette année"
        />
      </div>

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Prochaines réservations
          </h2>
          <Link to="/reservations">
            <Button variant="ghost" size="sm">
              Voir tout
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(({ booking, service, professional }) => {
              if (!service || !professional) return null;

              const bookingDate = new Date(booking.bookingDate);
              const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(bookingDate);

              return (
                <AppCard
                  key={booking._id}
                  tone="elevated"
                  className="rounded-2xl p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <span className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground">
                          {formattedDate}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          {booking.timeSlot}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        avec {professional.professionalName}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{service.price}€</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Link to={`/reservations/${booking._id}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Plus de détails
                        </Button>
                      </Link>
                      {user && professional?.userId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              const convId = await openOrCreateConversation(user._id, professional.userId!);
                              navigate(`/messages?conversationId=${encodeURIComponent(convId)}`);
                            } catch (e) {
                              console.error('Erreur ouverture conversation', e);
                            }
                          }}
                        >
                          Contacter
                        </Button>
                      )}
                    </div>
                  </div>
                </AppCard>
              );
            })
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucune réservation à venir"
              description="Explorez les services et réservez votre prochaine prestation beauté."
              action={
                <Link to="/services">
                  <Button>Découvrir les services</Button>
                </Link>
              }
            />
          )}
        </div>
      </div>

      {/* Featured Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Services populaires
          </h2>
          <Link to="/services">
            <Button variant="ghost" size="sm">
              Voir tout
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              isFavorited={favoriteIds.has(service._id)}
              isLiked={likedIds.has(service._id)}
              onToggleFavorite={(serviceId) => {
                toggleFavorite({ userId: user._id, targetId: serviceId, targetType: 'service' })
                  .then((res) => {
                    setFavoriteIds((prev) => {
                      const next = new Set(prev);
                      if (res.favorited) next.add(serviceId);
                      else next.delete(serviceId);
                      return next;
                    });
                    setFavoritesCount((prev) =>
                      Math.max(0, prev + (res.favorited ? 1 : -1))
                    );
                  })
                  .catch(console.error);
              }}
              onToggleLike={(serviceId) => {
                toggleLike(user._id, serviceId)
                  .then((res) => {
                    setLikedIds((prev) => {
                      const next = new Set(prev);
                      if (res.liked) next.add(serviceId);
                      else next.delete(serviceId);
                      return next;
                    });
                    setRecentServices((prev) =>
                      prev.map((s) =>
                        s._id === serviceId
                          ? { ...s, likesCount: s.likesCount + (res.liked ? 1 : -1) }
                          : s
                      )
                    );
                  })
                  .catch(console.error);
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/services" className="group">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-[28px] p-6 text-white hover:shadow-lg transition-shadow">
            <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="font-semibold mb-1">Découvrir les tendances</h3>
            <p className="text-sm opacity-90">Les services les plus populaires</p>
          </div>
        </Link>

        <Link to="/professionals" className="group">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-[28px] p-6 text-white hover:shadow-lg transition-shadow">
            <Star className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="font-semibold mb-1">Top professionnels</h3>
            <p className="text-sm opacity-90">Les mieux notés près de chez vous</p>
          </div>
        </Link>

        <Link to="/booking" className="group">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-[28px] p-6 text-white hover:shadow-lg transition-shadow">
            <Sparkles className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="font-semibold mb-1">Réserver maintenant</h3>
            <p className="text-sm opacity-90">Trouvez un créneau disponible et confirmez votre prochain soin.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
