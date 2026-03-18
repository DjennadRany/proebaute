import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import {
  fetchFavorites,
  fetchServiceDetails,
  fetchProfessionalById,
  toggleFavorite,
  type ApiService,
  type ApiProfessional,
} from '../api/client';
import { ServiceCard } from '../components/ServiceCard';
import { ProfessionalCard } from '../components/ProfessionalCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

export function FavoritesPage() {
  const { user } = useAuth();
  const [favoriteServices, setFavoriteServices] = useState<ApiService[]>([]);
  const [favoriteProfessionals, setFavoriteProfessionals] = useState<ApiProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const favs = await fetchFavorites(user._id);
        const services: ApiService[] = [];
        const professionals: ApiProfessional[] = [];

        for (const f of favs) {
          if (f.targetType === 'service') {
            try {
              const d = await fetchServiceDetails(f.targetId);
              services.push(d.service);
            } catch {
              // service supprimé
            }
          } else {
            try {
              const p = await fetchProfessionalById(f.targetId);
              professionals.push(p.professional);
            } catch {
              // pro supprimé
            }
          }
        }

        setFavoriteServices(services);
        setFavoriteProfessionals(professionals);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user._id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center text-muted-foreground">
        Chargement des favoris...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AppHeader
        eyebrow="Collection"
        title="Mes favoris"
        subtitle="Retrouvez vos services et professionnels préférés pour réserver plus vite."
      />

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="services" className="min-w-0">
            Services ({favoriteServices.length})
          </TabsTrigger>
          <TabsTrigger value="professionals" className="min-w-0">
            Professionnels ({favoriteProfessionals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          {favoriteServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  isFavorited
                  onToggleFavorite={async (serviceId) => {
                    try {
                      const res = await toggleFavorite({
                        userId: user._id,
                        targetId: serviceId,
                        targetType: 'service',
                      });
                      if (!res.favorited) {
                        setFavoriteServices((prev) =>
                          prev.filter((s) => s._id !== serviceId)
                        );
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="Aucun service favori"
              description="Ajoutez des services à vos favoris pour les retrouver facilement lors de vos prochaines réservations."
            />
          )}
        </TabsContent>

        <TabsContent value="professionals">
          {favoriteProfessionals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProfessionals.map((pro) => (
                <ProfessionalCard
                  key={pro._id}
                  professional={pro}
                  isFavorited
                  onToggleFavorite={async (proId) => {
                    try {
                      const res = await toggleFavorite({
                        userId: user._id,
                        targetId: proId,
                        targetType: 'professional',
                      });
                      if (!res.favorited) {
                        setFavoriteProfessionals((prev) =>
                          prev.filter((p) => p._id !== proId)
                        );
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="Aucun professionnel favori"
              description="Ajoutez des professionnels à vos favoris pour suivre ceux avec qui vous aimez réserver."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
