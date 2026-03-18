import { MapPin, Star, BadgeCheck, Heart, Bookmark } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiProfessional } from '../api/client';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

interface ProfessionalCardProps {
  professional: ApiProfessional;
  servicesCount?: number;
  onToggleFavorite?: (professionalId: string) => void;
  isFavorited?: boolean;
  likesCount?: number;
}

export function ProfessionalCard({
  professional,
  servicesCount = 0,
  onToggleFavorite,
  isFavorited = false,
  likesCount = 0,
}: ProfessionalCardProps) {
  const { user } = useAuth();

  const displayName =
    professional.professionalName || (professional as any).firstName || 'Pro';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('');
  const logoSrc = (professional as any).gallery?.[0] as string | undefined;

  return (
    <div className="w-full min-w-0 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border">
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center text-lg sm:text-xl font-semibold text-white overflow-hidden">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={professional.professionalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {professional.verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2 min-w-0 break-words">
                {professional.professionalName}
              </h3>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(professional._id)}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition-colors ${
                    isFavorited
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{professional.specialty}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{professional.ratingAverage}</span>
                <span className="text-muted-foreground">({professional.reviewsCount})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-xs">{likesCount}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {professional.bio || 'Aucune description'}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{professional.location}</span>
        </div>

        <div className="flex gap-2 mb-4">
          <Badge variant="outline" className="text-xs">
            {servicesCount > 0 ? `${servicesCount} services` : 'Services'}
          </Badge>
        </div>

        <Link to={user ? `/professionals/${professional._id}` : '/login'} className="block w-full">
          <Button className="w-full" variant="default">
            Voir le profil
          </Button>
        </Link>
      </div>
    </div>
  );
}
