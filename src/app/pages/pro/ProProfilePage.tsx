import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, MapPin, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfessionalByUserId, type ApiProfessional } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { AppCard } from '../../components/AppCard';
import { EntityAvatar } from '../../components/EntityAvatar';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export function ProProfilePage() {
  const { user } = useAuth();
  const [pro, setPro] = useState<ApiProfessional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessionalByUserId(user._id)
      .then(setPro)
      .catch(() => setPro(null))
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="mx-auto max-w-3xl">
        <AppHeader eyebrow="Profil" title="Fiche pro" subtitle="Aucune fiche liée à ce compte." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AppHeader
        eyebrow="Profil"
        title={pro.professionalName}
        subtitle="Aperçu de votre vitrine et raccourcis utiles."
      />
      <AppCard tone="premium" className="rounded-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <EntityAvatar
            name={pro.professionalName}
            size="lg"
            imageSrc={pro.gallery?.[0] ?? null}
            verified={pro.verified}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{pro.specialty}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {pro.ratingAverage?.toFixed(1) ?? '—'} ({pro.reviewsCount ?? 0} avis)
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {pro.location}
                </span>
              </div>
            </div>
            {pro.bio && <p className="text-sm leading-relaxed text-muted-foreground">{pro.bio}</p>}
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/professionals/${pro._id}`}>
                Voir la fiche publique
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
