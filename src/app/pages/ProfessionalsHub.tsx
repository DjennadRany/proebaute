import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ProfessionalCard } from '../components/ProfessionalCard';
import type { ApiProfessional } from '../api/client';
import { fetchProfessionals, fetchFavorites, fetchLikes, toggleFavorite } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const specialties = [
  'Tous',
  'Coiffure & beauté',
  'Barbier',
  'Esthétique',
  'Prothésie ongulaire',
  'Make-up',
];

export function ProfessionalsHub() {
  const { user } = useAuth();
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteProIds, setFavoriteProIds] = useState<Set<string>>(new Set());
  const [likesPerPro, setLikesPerPro] = useState<Record<string, number>>({});

  useEffect(() => {
    const specialty = selectedSpecialty === 'Tous' ? undefined : selectedSpecialty;
    fetchProfessionals(undefined, specialty)
      .then((pros) => {
        setProfessionals(pros);
        // approx: on utilisera les avis comme proxy d'engagement si pas de likes par service ici
        const likesMap: Record<string, number> = {};
        pros.forEach((p) => {
          likesMap[p._id] = p.reviewsCount ?? 0;
        });
        setLikesPerPro(likesMap);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedSpecialty]);

  useEffect(() => {
    if (!user) return;
    fetchFavorites(user._id)
      .then((favs) => {
        setFavoriteProIds(
          new Set(favs.filter((f) => f.targetType === 'professional').map((f) => f.targetId))
        );
      })
      .catch(() => {});
  }, [user?._id]);

  const filteredProfessionals = professionals.filter((professional) => {
    const matchesSearch =
      searchQuery === '' ||
      professional.professionalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (professional.bio ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      professional.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center text-muted-foreground">
        Chargement des professionnels...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppHeader
        eyebrow="Professionnels"
        title="Nos professionnels beauté"
        subtitle={`${professionals.length} professionnels disponibles pour vous accompagner à domicile ou en salon.`}
      />

      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un professionnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {specialties.map((specialty) => (
            <Badge
              key={specialty}
              variant={selectedSpecialty === specialty ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap px-4 py-1.5 hover:bg-accent transition-colors"
              onClick={() => setSelectedSpecialty(specialty)}
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>

      {filteredProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard
              key={professional._id}
              professional={professional}
              servicesCount={0}
              isFavorited={favoriteProIds.has(professional._id)}
              likesCount={likesPerPro[professional._id] ?? 0}
              onToggleFavorite={async (proId) => {
                if (!user) return;
                try {
                  const res = await toggleFavorite({
                    userId: user._id,
                    targetId: proId,
                    targetType: 'professional',
                  });
                  setFavoriteProIds((prev) => {
                    const next = new Set(prev);
                    if (res.favorited) next.add(proId);
                    else next.delete(proId);
                    return next;
                  });
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="Aucun professionnel trouvé"
          description="Essayez de modifier votre recherche ou votre spécialité pour afficher d'autres profils."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('Tous');
              }}
            >
              Réinitialiser les filtres
            </Button>
          }
        />
      )}
    </div>
  );
}
