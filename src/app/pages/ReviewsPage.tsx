import { useEffect, useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Avis et évaluations</h1>
        <p className="text-muted-foreground">Vos retours d'expérience sur les services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Note moyenne</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Avis donnés</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Star className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fiveStars}</p>
              <p className="text-xs text-muted-foreground">Notes 5 étoiles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Mes avis</h2>
        <Badge variant="outline">{reviews.length} avis</Badge>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            Aucun avis pour le moment
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review._id} review={toCardReview(review)} />
          ))
        )}
      </div>
    </div>
  );
}
