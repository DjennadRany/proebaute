import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfessionalById, fetchProfessionalByUserId, type ApiReview } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { ReviewCard } from '../../components/ReviewCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';

export function ProReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pro = await fetchProfessionalByUserId(user._id);
        if (!pro || cancelled) {
          if (!cancelled) setReviews([]);
          return;
        }
        const detail = await fetchProfessionalById(pro._id);
        if (!cancelled) setReviews(detail.reviews ?? []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user._id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AppHeader
        eyebrow="Réputation"
        title="Avis clients"
        subtitle="Consultez les retours laissés sur vos prestations."
      />
      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Pas encore d’avis"
          description="Les avis vérifiés apparaîtront ici après vos premières prestations."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={{
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                clientName: r.clientName ?? 'Cliente',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
