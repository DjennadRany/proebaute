import { Heart, MessageCircle, Star, Bookmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import type { ApiService, ApiProfessional } from '../api/client';
import { EntityAvatar } from './EntityAvatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

interface ServiceCardProps {
  service: ApiService;
  professional?: ApiProfessional | null;
  /** Si fourni, le bouton favori appelle l'API */
  onToggleFavorite?: (serviceId: string) => void;
  onToggleLike?: (serviceId: string) => void;
  /** Optionnel: ouvrir directement la section avis/commentaires */
  onOpenComments?: (serviceId: string) => void;
  isFavorited?: boolean;
  isLiked?: boolean;
}

export function ServiceCard({
  service,
  professional,
  onToggleFavorite,
  onToggleLike,
  onOpenComments,
  isFavorited = false,
  isLiked = false,
}: ServiceCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const primaryMedia = service.media?.[0];
  const safeImageSrc =
    primaryMedia && !primaryMedia.includes('via.placeholder.com')
      ? primaryMedia
      : 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <Link to={user ? `/services/${service._id}` : '/login'} className="block w-full min-w-0">
      <div className="group w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_30px_rgba(17,17,23,0.08)] transition-all duration-300 hover:shadow-[0_18px_46px_rgba(17,17,23,0.12)]">
        <div className="relative">
          <ImageWithFallback
            src={safeImageSrc}
            alt={service.title}
            className="w-full h-44 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />

          {/* Bouton favori dans l'image */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite?.(service._id);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                isFavorited
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/90 text-foreground hover:bg-white'
              }`}
              aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Bookmark className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground mb-1 line-clamp-1">{service.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {service.category}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{service.ratingAverage ?? 0}</span>
            </div>
          </div>

          {professional && (
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
              <EntityAvatar
                name={professional.professionalName || (professional as any).firstName || 'P'}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {professional.professionalName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{professional.location}</p>
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleLike?.(service._id);
                }}
                className={`flex items-center gap-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'hover:text-red-500'
                }`}
                aria-label={isLiked ? 'Retirer le like' : 'Liker le service'}
              >
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
                <span className="text-xs">{service.likesCount ?? 0}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenComments) {
                    onOpenComments(service._id);
                    return;
                  }
                  if (user) navigate(`/services/${service._id}#service-comments`);
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="Ouvrir les avis"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{service.reviewsCount ?? 0}</span>
              </button>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-lg font-semibold text-foreground">{service.price}€</span>
              <span className="text-xs text-muted-foreground">{service.duration} min</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
