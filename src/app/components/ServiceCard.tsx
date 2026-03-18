import { Heart, MessageCircle, Star, Bookmark } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiService, ApiProfessional } from '../api/client';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

interface ServiceCardProps {
  service: ApiService;
  professional?: ApiProfessional | null;
  /** Si fourni, le bouton favori appelle l’API */
  onToggleFavorite?: (serviceId: string) => void;
  onToggleLike?: (serviceId: string) => void;
  isFavorited?: boolean;
  isLiked?: boolean;
}

export function ServiceCard({
  service,
  professional,
  onToggleFavorite,
  onToggleLike,
  isFavorited = false,
  isLiked = false,
}: ServiceCardProps) {
  const { user } = useAuth();

  const primaryMedia = service.media?.[0];
  const safeImageSrc =
    primaryMedia && !primaryMedia.includes('via.placeholder.com')
      ? primaryMedia
      : 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <Link to={user ? `/services/${service._id}` : '/login'} className="block w-full min-w-0">
      <div className="group relative w-full min-w-0 rounded-xl overflow-hidden border border-border bg-muted shadow-sm transition-all duration-500 hover:shadow-lg">
        <ImageWithFallback
          src={safeImageSrc}
          alt={service.title}
          className="w-full h-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
        />

        {/* Bouton favori dans l'image */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(service._id);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              isFavorited
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/90 text-foreground hover:bg-white'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Overlay d'informations : visible par défaut sur mobile, animé au hover sur desktop */}
        <div className="absolute inset-0 flex items-end pointer-events-none">
          <div
            className="
              w-full
              bg-white/50
              bg-gradient-to-t from-white/70 via-white/40 to-white/20
              backdrop-blur-md
              border-t border-border
              p-3 sm:p-4
              translate-y-0
              opacity-100
              md:translate-y-full
              md:opacity-0
              md:group-hover:translate-y-0
              md:group-hover:opacity-100
              md:group-hover:shadow-[0_-20px_40px_rgba(0,0,0,0.25)]
              transition-transform transition-shadow duration-500 ease-out
            "
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
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
                <span className="text-sm font-medium">{service.ratingAverage}</span>
              </div>
            </div>

            {professional && (
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-sm font-medium">
                  {(
                    professional.professionalName ||
                    (professional as any).firstName ||
                    'P'
                  )
                    .trim()
                    .charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {professional.professionalName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{professional.location}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleLike?.(service._id);
                  }}
                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
                  <span className="text-xs">{service.likesCount}</span>
                </button>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{service.reviewsCount}</span>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-lg font-semibold text-foreground">{service.price}€</span>
                <span className="text-xs text-muted-foreground">{service.duration} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
