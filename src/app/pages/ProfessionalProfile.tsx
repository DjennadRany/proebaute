import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Star, BadgeCheck, Calendar, MessageCircle, Heart, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchProfessionalById,
  fetchFavorites,
  fetchLikes,
  toggleFavorite,
  toggleLike,
  type ApiProfessional,
  type ApiService,
  type ApiReview,
} from '../api/client';
import { Button } from '../components/ui/button';
import { ServiceCard } from '../components/ServiceCard';
import { ReviewCard, type ReviewCardReview } from '../components/ReviewCard';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { openOrCreateConversation } from '../utils/messaging';

export function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState<ApiProfessional | null>(null);
  const [services, setServices] = useState<ApiService[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likedServiceIds, setLikedServiceIds] = useState<Set<string>>(new Set());
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchProfessionalById(id)
      .then((data) => {
        setProfessional(data.professional);
        setServices(data.services);
        setReviews(data.reviews);
        // total des likes sur tous les services de ce pro
        const likesSum = data.services.reduce((sum, s) => sum + (s.likesCount ?? 0), 0);
        setTotalLikes(likesSum);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      fetchFavorites(user._id).catch(() => []),
      fetchLikes(user._id).catch(() => []),
    ])
      .then(([favs, likes]) => {
        const hasFavPro = favs.some(
          (f) => f.targetType === 'professional' && f.targetId === id
        );
        setIsFavorited(hasFavPro);

        const likedForPro = likes
          .map((l) => l.serviceId)
          .filter((sid): sid is string => Boolean(sid))
          .filter((sid) => services.some((s) => s._id === sid));
        setLikedServiceIds(new Set(likedForPro));
      })
      .catch((e) => console.error(e));
  }, [user?._id, id, services]);

  const handleToggleFavoriteProfessional = () => {
    if (!user || !id) return;
    toggleFavorite({ userId: user._id, targetId: id, targetType: 'professional' })
      .then((res) => setIsFavorited(res.favorited))
      .catch((e) => console.error(e));
  };

  const toCardReview = (r: ApiReview): ReviewCardReview => ({
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    clientName: r.clientName ?? 'Client',
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Professionnel non trouvé</h2>
        <Link to="/professionals">
          <Button>Retour aux professionnels</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/professionals">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux professionnels
        </Button>
      </Link>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-2xl p-5 sm:p-8 mb-8 border border-border">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center text-3xl font-semibold text-white">
              {professional.professionalName.split(' ').map((n) => n[0]).join('')}
            </div>
            {professional.verified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1.5">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {professional.professionalName}
            </h1>
            <p className="text-lg text-muted-foreground mb-3">{professional.specialty}</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">{professional.ratingAverage}</span>
                <span className="text-muted-foreground">({professional.reviewsCount} avis)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span>{professional.location}</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed mt-4">
              {professional.bio || 'Aucune description'}
            </p>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              {services.length > 0 && (
                <Link to={`/booking/${services[0]._id}`} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Calendar className="w-5 h-5 mr-2" />
                    Réserver un créneau
                  </Button>
                </Link>
              )}
              {user && professional.userId && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={async () => {
                    try {
                      const convId = await openOrCreateConversation(user._id, professional.userId!);
                      navigate(`/messages?conversationId=${encodeURIComponent(convId)}`);
                    } catch (e) {
                      console.error('Erreur ouverture conversation', e);
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message
                </Button>
              )}
              {user && (
                <button
                  type="button"
                  onClick={handleToggleFavoriteProfessional}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
                    isFavorited
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="services" className="flex-1">
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1">
            Avis ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1">
            À propos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  professional={professional}
                  isLiked={likedServiceIds.has(service._id)}
                  onToggleLike={async (serviceId) => {
                    if (!user) return;
                    try {
                      const res = await toggleLike(user._id, serviceId);
                      setLikedServiceIds((prev) => {
                        const next = new Set(prev);
                        if (res.liked) next.add(serviceId);
                        else next.delete(serviceId);
                        return next;
                      });
                      setServices((prev) =>
                        prev.map((s) =>
                          s._id === serviceId
                            ? {
                                ...s,
                                likesCount: s.likesCount + (res.liked ? 1 : -1),
                              }
                            : s
                        )
                      );
                      setTotalLikes((prev) => Math.max(0, prev + (res.liked ? 1 : -1)));
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">Aucun service disponible</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          {reviews.length > 0 ? (
            <div className="space-y-4 max-w-3xl">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={toCardReview(review)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">Aucun avis pour le moment</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="about">
          <div className="max-w-3xl space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Informations</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Localisation</p>
                    <p className="text-sm text-muted-foreground">{professional.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Évaluation</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.ratingAverage}/5 basé sur {professional.reviewsCount} avis
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Vérification</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.verified ? 'Professionnel vérifié' : 'Non vérifié'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-3">Spécialités</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{professional.specialty}</Badge>
                {services.map((s) => (
                  <Badge key={s._id} variant="outline">
                    {s.category}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Engagement des clients</h3>
                <p className="text-sm text-muted-foreground">
                  Total des likes sur les services de ce professionnel
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span className="text-xl font-semibold text-foreground">{totalLikes}</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
