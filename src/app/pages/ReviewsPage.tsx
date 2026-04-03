import { useEffect, useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { fetchReviewsByClient, type ApiReview } from '../api/client';
import { ReviewCard, type ReviewCardReview } from '../components/ReviewCard';
import { Badge } from '../components/ui/badge';

export function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewsByClient(user._id)
      .then(setReviews)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user._id]);

  const toCardReview = (r: ApiReview): ReviewCardReview => ({
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    clientName: user.firstName + ' ' + user.lastName,
  });

  const averageRating =
    reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const fiveStars = reviews.filter((r) => r.rating === 5).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-muted-foreground">
        Chargement des avis...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AppHeader
        eyebrow="Confiance"
        title="Avis et évaluations"
        subtitle="Retrouvez vos retours clients et gardez une trace claire de votre experience LocBeaute."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AppCard tone="elevated" className="rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Note moyenne</p>
            </div>
          </div>
        </AppCard>

        <AppCard tone="elevated" className="rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Avis donnés</p>
            </div>
          </div>
        </AppCard>

        <AppCard tone="elevated" className="rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Star className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fiveStars}</p>
              <p className="text-xs text-muted-foreground">Notes 5 étoiles</p>
            </div>
          </div>
        </AppCard>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-foreground">Mes avis</h2>
        <Badge variant="outline">{reviews.length} avis</Badge>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Aucun avis pour le moment"
            description="Vos futurs retours et évaluations seront rassemblés ici dès que vous laisserez un commentaire."
          />
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review._id} review={toCardReview(review)} />
          ))
        )}
      </div>
    </div>
  );
}
