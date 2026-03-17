import { useEffect, useState } from 'react';
import { Calendar, Heart, MessageCircle, Star, TrendingUp, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { ServiceCard } from '../components/ServiceCard';
import { Badge } from '../components/ui/badge';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Bonjour, {user.firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord beauté
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Réservations à venir"
          value={upcomingBookings.length}
          icon={Calendar}
          description="Prochaines séances"
          onClick={() => (window.location.href = '/reservations')}
        />
        <StatCard
          title="Services favoris"
          value={favoritesCount}
          icon={Heart}
          description="Services sauvegardés"
          onClick={() => (window.location.href = '/favorites')}
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
        <div className="flex items-center justify-between mb-4">
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
                <div
                  key={booking._id}
                  className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {formattedDate}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {booking.timeSlot}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        avec {professional.professionalName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{service.price}€</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/reservations/${booking._id}`}>
                        <Button variant="outline" size="sm">
                          Plus de détails
                        </Button>
                      </Link>
                      {user && professional?.userId && (
                        <Button
                          variant="outline"
                          size="sm"
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
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Aucune réservation à venir
              </p>
              <Link to="/services">
                <Button>Découvrir les services</Button>
              </Link>
            </div>
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
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
            <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="font-semibold mb-1">Découvrir les tendances</h3>
            <p className="text-sm opacity-90">Les services les plus populaires</p>
          </div>
        </Link>

        <Link to="/professionals" className="group">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
            <Star className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="font-semibold mb-1">Top professionnels</h3>
            <p className="text-sm opacity-90">Les mieux notés près de chez vous</p>
          </div>
        </Link>

        <Link to="/booking" className="group">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
            <Calendar className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="font-semibold mb-1">Réserver maintenant</h3>
            <p className="text-sm opacity-90">Trouvez un créneau disponible</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
