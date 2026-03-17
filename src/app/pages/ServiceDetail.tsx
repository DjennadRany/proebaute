import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Clock, MapPin, Star, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchServiceDetails,
  fetchServicesByCategory,
  fetchFavorites,
  fetchLikes,
  toggleFavorite,
  toggleLike,
  createReview,
  type ApiService,
  type ApiProfessional,
  type ApiReview,
} from '../api/client';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { SocialActionBar } from '../components/SocialActionBar';
import { ReviewCard, type ReviewCardReview } from '../components/ReviewCard';
import { ServiceCard } from '../components/ServiceCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { openOrCreateConversation } from '../utils/messaging';

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ApiService | null>(null);
  const [professional, setProfessional] = useState<ApiProfessional | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [relatedServices, setRelatedServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<Set<string>>(new Set());
  const [likedServiceIds, setLikedServiceIds] = useState<Set<string>>(new Set());
  const [commentsCount, setCommentsCount] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newRating, setNewRating] = useState(5);

  useEffect(() => {
    if (!id) return;
    fetchServiceDetails(id)
      .then((data) => {
        setService(data.service);
        setProfessional(data.professional);
        setReviews(data.reviews ?? []);
        if (data.service.category) {
          return fetchServicesByCategory(data.service.category).then((list) =>
            list.filter((s) => s._id !== id).slice(0, 3)
          );
        }
        return [];
      })
      .then((list) => setRelatedServices(Array.isArray(list) ? list : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!service) return;
    setCommentsCount(service.reviewsCount ?? null);
  }, [service]);

  // Charger l'état "favori" pour ce service
  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      fetchFavorites(user._id).catch(() => []),
      fetchLikes(user._id).catch(() => []),
    ])
      .then(([favs, likes]) => {
        const favServiceIds = new Set(
          favs.filter((f) => f.targetType === 'service').map((f) => f.targetId)
        );
        const likedIds = new Set(
          likes.map((l) => l.serviceId).filter((sid): sid is string => Boolean(sid))
        );

        setFavoriteServiceIds(favServiceIds);
        setLikedServiceIds(likedIds);

        const hasFav = favs.some(
          (f) => f.targetType === 'service' && f.targetId === id
        );
        setIsFavorited(hasFav);

        const hasLike = likedIds.has(id);
        setIsLiked(hasLike);
      })
      .catch((e) => console.error(e));
  }, [user?._id, id]);

  const handleToggleFavorite = () => {
    if (!user || !id) return;
    toggleFavorite({ userId: user._id, targetId: id, targetType: 'service' })
      .then((res) => {
        setIsFavorited(res.favorited);
        setFavoriteServiceIds((prev) => {
          const next = new Set(prev);
          if (res.favorited) next.add(id);
          else next.delete(id);
          return next;
        });
      })
      .catch((e) => console.error(e));
  };

  const handleToggleLike = () => {
    if (!user || !id) return;
    toggleLike(user._id, id)
      .then((res) => {
        setIsLiked(res.liked);
        setLikesCount((prev) => {
          const baseFromService =
            service && typeof service.likesCount === 'number' ? service.likesCount : 0;
          const current = typeof prev === 'number' ? prev : baseFromService;
          return current + (res.liked ? 1 : -1);
        });
        setLikedServiceIds((prev) => {
          const next = new Set(prev);
          if (res.liked) next.add(id);
          else next.delete(id);
          return next;
        });
      })
      .catch((e) => console.error(e));
  };

  const handleToggleFavoriteRelated = (serviceId: string) => {
    if (!user) return;
    toggleFavorite({ userId: user._id, targetId: serviceId, targetType: 'service' })
      .then((res) => {
        setFavoriteServiceIds((prev) => {
          const next = new Set(prev);
          if (res.favorited) next.add(serviceId);
          else next.delete(serviceId);
          return next;
        });
        setRelatedServices((prev) =>
          prev.map((s) =>
            s._id === serviceId
              ? {
                  ...s,
                  // on ne modifie pas d'autres champs ici, seulement on garde la carte à jour si besoin plus tard
                  likesCount: s.likesCount,
                }
              : s
          )
        );
      })
      .catch((e) => console.error(e));
  };

  const handleToggleLikeRelated = (serviceId: string) => {
    if (!user) return;
    toggleLike(user._id, serviceId)
      .then((res) => {
        setLikedServiceIds((prev) => {
          const next = new Set(prev);
          if (res.liked) next.add(serviceId);
          else next.delete(serviceId);
          return next;
        });
        setRelatedServices((prev) =>
          prev.map((s) =>
            s._id === serviceId
              ? {
                  ...s,
                  likesCount: s.likesCount + (res.liked ? 1 : -1),
                }
              : s
          )
        );
      })
      .catch((e) => console.error(e));
  };

  const handleSubmitComment = async () => {
    if (!user || !id) return;
    const content = newComment.trim();
    if (!content) return;
    try {
      setIsSubmittingComment(true);
      await createReview({
        bookingId: undefined, // avis sans réservation
        clientId: user._id,
        professionalId: service!.professionalId,
        serviceId: id,
        rating: newRating,
        comment: content,
      });
      setReviews((prev) => [
        {
          _id: `local-${Date.now()}`,
          bookingId: undefined,
          clientId: user._id,
          professionalId: service!.professionalId,
          serviceId: id,
          rating: newRating,
          comment: content,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCommentsCount((prev) => (prev != null ? prev + 1 : (service?.reviewsCount ?? 0) + 1));
      setNewComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleScrollToComments = () => {
    const el = document.getElementById('service-comments');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toCardReview = (r: ApiReview): ReviewCardReview => ({
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    clientName: r.clientName ?? 'Client',
  });

  if (loading || !id) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {loading ? 'Chargement...' : 'ID manquant'}
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Service non trouvé</h2>
        <Link to="/services">
          <Button>Retour aux services</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/services">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux services
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted mb-6">
            <ImageWithFallback
              src={
                service.media?.[0] && !service.media[0].includes('via.placeholder.com')
                  ? service.media[0]
                  : 'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=1200'
              }
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mb-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{service.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.ratingAverage}</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{service.title}</h1>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-3xl font-bold text-foreground">{service.price}€</div>
                <div className="text-sm text-muted-foreground">{service.duration} minutes</div>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{service.description}</p>
          </div>

          <SocialActionBar
            isLiked={isLiked}
            isFavorited={isFavorited}
            likesCount={likesCount != null ? likesCount : service.likesCount}
            commentsCount={commentsCount != null ? commentsCount : service.commentsCount}
            onLike={handleToggleLike}
            onComment={handleScrollToComments}
            onFavorite={handleToggleFavorite}
          />

          {professional && (
            <div className="mt-8 bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                À propos du professionnel
              </h2>
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center text-xl font-semibold text-white">
                    {(
                      professional.professionalName ||
                      (professional as any).firstName ||
                      'Pro'
                    )
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  {professional.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {professional.professionalName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{professional.specialty}</p>
                  <p className="text-sm text-muted-foreground mb-4">{professional.bio}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{professional.ratingAverage}</span>
                      <span className="text-muted-foreground">({professional.reviewsCount} avis)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                      <MapPin className="w-4 h-4" />
                      <span className="break-words">{professional.location}</span>
                    </div>
                  </div>
                </div>
                <Link to={`/professionals/${professional._id}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">Voir le profil</Button>
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8" id="service-comments">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Commentaires {commentsCount != null ? `(${commentsCount})` : ''}
            </h2>
            {user && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Votre note :</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="text-yellow-400"
                    >
                      <Star
                        className="w-4 h-4"
                        fill={star <= newRating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Partagez votre expérience..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                >
                  {isSubmittingComment ? 'Envoi...' : 'Publier le commentaire'}
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard key={review._id} review={toCardReview(review)} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun avis pour le moment.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="bg-card rounded-xl p-6 border border-border mb-6">
              <h3 className="font-semibold text-foreground mb-4">Réserver ce service</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Durée: {service.duration} minutes</span>
                </div>
                {professional && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{professional.location}</span>
                  </div>
                )}
              </div>
              <Link to={`/booking/${service._id}`}>
                <Button className="w-full mb-3" size="lg">
                  Réserver - {service.price}€
                </Button>
              </Link>
              {professional?.userId && user && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const convId = await openOrCreateConversation(user._id, professional.userId!);
                      navigate(`/messages?conversationId=${encodeURIComponent(convId)}`);
                    } catch (e) {
                      console.error('Erreur ouverture conversation', e);
                    }
                  }}
                >
                  Contacter le professionnel
                </Button>
              )}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 text-sm">
              <h4 className="font-medium text-foreground mb-2">Politique d'annulation</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Annulation gratuite jusqu'à 48h avant le rendez-vous. Au-delà, des frais de 50% du
                montant de la prestation seront appliqués.
              </p>
            </div>
          </div>
        </div>
      </div>

      {relatedServices.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Services similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedServices.map((relatedService) => (
              <ServiceCard
                key={relatedService._id}
                service={relatedService}
                professional={professional}
                isFavorited={favoriteServiceIds.has(relatedService._id)}
                isLiked={likedServiceIds.has(relatedService._id)}
                onToggleFavorite={handleToggleFavoriteRelated}
                onToggleLike={handleToggleLikeRelated}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
