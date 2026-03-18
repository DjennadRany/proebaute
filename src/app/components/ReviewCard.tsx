import { Star } from 'lucide-react';
import { AppCard } from './AppCard';
import { EntityAvatar } from './EntityAvatar';

export interface ReviewCardReview {
  rating: number;
  comment: string;
  createdAt: string | null;
  clientName?: string;
}

interface ReviewCardProps {
  review: ReviewCardReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (dateStr == null || dateStr === '') return '—';
    const ms = typeof dateStr === 'string' && /^\d+$/.test(dateStr) ? Number(dateStr) : NaN;
    const date = !Number.isNaN(ms) ? new Date(ms) : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <AppCard tone="elevated" className="rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <EntityAvatar name={review.clientName || 'Client'} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="font-medium text-foreground">{review.clientName ?? 'Client'}</h4>
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {formatDate(review.createdAt ?? null)}
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    </AppCard>
  );
}
