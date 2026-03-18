import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ServiceCard } from '../components/ServiceCard';
import { ApiService, ApiProfessional, fetchServices, fetchFavorites, toggleFavorite, fetchLikes, toggleLike, fetchProfessionals } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from '../components/ui/sheet';

export function ServicesHub() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<ApiService[]>([]);
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'likes_desc'>('relevance');
  const [cityFilter, setCityFilter] = useState('');
  // Proximité : toujours active par défaut, ne peut pas être désactivée
  const [nearMe] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [data, favs, likes, pros] = await Promise.all([
          fetchServices(),
          user ? fetchFavorites(user._id).catch(() => []) : Promise.resolve([]),
          user ? fetchLikes(user._id).catch(() => []) : Promise.resolve([]),
          fetchProfessionals().catch(() => []),
        ]);
        setServices(data);
        setProfessionals(pros);
        setFavoriteIds(
          new Set(favs.filter((f) => f.targetType === 'service').map((f) => f.targetId))
        );
        setLikedIds(
          new Set(likes.map((l) => l.serviceId).filter((id): id is string => Boolean(id)))
        );
      } catch (e) {
        console.error('Erreur chargement services', e);
      }
    }
    load();
  }, [user?._id]);

  // Catégories dynamiques basées sur les données réelles
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['Tous', ...Array.from(set).sort()];
  }, [services]);

  const proById = useMemo(() => {
    const map: Record<string, ApiProfessional> = {};
    professionals.forEach((p) => {
      map[p._id] = p;
    });
    return map;
  }, [professionals]);

  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === 'Tous' || service.category === selectedCategory;
    const pro = proById[service.professionalId];
    const proCity = pro?.city || pro?.location || '';
    const matchesCity = !cityFilter.trim()
      ? true
      : proCity.toLowerCase().includes(cityFilter.toLowerCase());

    if (!searchQuery.trim()) {
      return matchesCategory && matchesCity;
    }

    const terms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const haystack = [
      service.title,
      service.description,
      service.category,
      ...(Array.isArray((service as any).tags) ? (service as any).tags : []),
      proCity,
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = terms.every((term) => haystack.includes(term));

    // Filtre ville basé sur la ville / localisation du professionnel associé
    return matchesCategory && matchesSearch && matchesCity;
  }).sort((a, b) => {
    const proA = proById[a.professionalId];
    const proB = proById[b.professionalId];
    const city = cityFilter.trim().toLowerCase();

    // Option "plus proche de moi" (approximation par ville égale à celle saisie)
    if (nearMe && city) {
      const aNear = (proA?.city || proA?.location || '').toLowerCase().includes(city) ? 0 : 1;
      const bNear = (proB?.city || proB?.location || '').toLowerCase().includes(city) ? 0 : 1;
      if (aNear !== bNear) {
        return aNear - bNear;
      }
    }

    switch (sortMode) {
      case 'price_asc':
        return (a.price ?? 0) - (b.price ?? 0);
      case 'price_desc':
        return (b.price ?? 0) - (a.price ?? 0);
      case 'rating_desc':
        return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
      case 'likes_desc':
        return (b.likesCount ?? 0) - (a.likesCount ?? 0);
      case 'relevance':
      default:
        return 0;
    }
  });

  // Si l'utilisateur n'est pas connecté, on affiche une vue "invité"
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Découvrez les services ProBeauté
        </h1>
        <p className="text-muted-foreground mb-6">
          Connectez-vous pour voir les services disponibles près de chez vous, les ajouter en
          favoris et réserver vos soins en un clic.
        </p>
        <Button asChild>
          <a href="/login">Se connecter pour voir les services</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppHeader
        eyebrow="Découverte"
        title="Découvrez nos services beauté"
        subtitle={`${services.length} services disponibles, triés pour vous aider à réserver plus vite près de chez vous.`}
      />

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="self-end sm:self-auto">
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtres & tri</SheetTitle>
                <SheetDescription>
                  Affinez les résultats selon vos préférences.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Trier par</p>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sort"
                        className="h-4 w-4"
                        checked={sortMode === 'relevance'}
                        onChange={() => setSortMode('relevance')}
                      />
                      <span>Pertinence (par défaut)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sort"
                        className="h-4 w-4"
                        checked={sortMode === 'price_asc'}
                        onChange={() => setSortMode('price_asc')}
                      />
                      <span>Prix : du moins cher au plus cher</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sort"
                        className="h-4 w-4"
                        checked={sortMode === 'price_desc'}
                        onChange={() => setSortMode('price_desc')}
                      />
                      <span>Prix : du plus cher au moins cher</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sort"
                        className="h-4 w-4"
                        checked={sortMode === 'rating_desc'}
                        onChange={() => setSortMode('rating_desc')}
                      />
                      <span>Les mieux notés</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sort"
                        className="h-4 w-4"
                        checked={sortMode === 'likes_desc'}
                        onChange={() => setSortMode('likes_desc')}
                      />
                      <span>Les plus likés</span>
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Ville</p>
                  <Input
                    type="text"
                    placeholder="Paris, Lyon, Marseille..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Filtre les résultats dont les informations contiennent cette ville.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Proximité</p>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={nearMe}
                      readOnly
                    />
                    <span>Le plus proche de moi (basé sur la ville saisie) — toujours actif</span>
                  </label>
                </div>
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSortMode('relevance');
                    setCityFilter('');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap px-4 py-1.5 hover:bg-accent transition-colors"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              isFavorited={favoriteIds.has(service._id)}
              isLiked={likedIds.has(service._id)}
              onToggleFavorite={(serviceId) => {
                toggleFavorite({ userId: user._id, targetId: serviceId, targetType: 'service' })
                  .then(() => {
                    setFavoriteIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(serviceId)) next.delete(serviceId);
                      else next.add(serviceId);
                      return next;
                    });
                  })
                  .catch(console.error);
              }}
              onToggleLike={(serviceId) => {
                toggleLike(user._id, serviceId)
                  .then((res) => {
                    setLikedIds((prev) => {
                      const next = new Set(prev);
                      if (res.liked) next.add(serviceId);
                      else next.delete(serviceId);
                      return next;
                    });
                    setServices((prev) =>
                      prev.map((s) =>
                        s._id === serviceId
                          ? {
                              ...s,
                              likesCount: (s.likesCount ?? 0) + (res.liked ? 1 : -1),
                            }
                          : s
                      )
                    );
                  })
                  .catch(console.error);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="Aucun service trouvé"
          description="Essayez de modifier votre recherche, votre ville ou votre catégorie pour afficher d’autres résultats."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tous');
                setCityFilter('');
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
