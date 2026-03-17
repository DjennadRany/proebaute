import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ApiProfessional, ApiService, fetchProfessionals, fetchServices } from '../api/client';
import { ServiceCard } from '../components/ServiceCard';
import { ProfessionalCard } from '../components/ProfessionalCard';

const HERO_VIDEO_URL =
  'https://videos.pexels.com/video-files/5927793/5927793-hd_1920_1080_25fps.mp4';
const HERO_POSTER_URL =
  'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Paris');
  const [services, setServices] = useState<ApiService[]>([]);
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);

  useEffect(() => {
    Promise.all([
      fetchServices().catch(() => []),
      fetchProfessionals().catch(() => []),
    ]).then(([s, p]) => {
      setServices(s);
      setProfessionals(p);
    });
  }, []);

  const handleClientClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login?role=client');
    }
  };

  const handleProClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login?role=pro');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border">
      {/* Vidéo de fond */}
      <div className="absolute inset-0 -z-10">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER_URL}
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10" />
      </div>

      <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-18 text-white grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
        {/* Bloc gauche : texte principal */}
        <div className="space-y-6 max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ProBeauté · Beauty on demand
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
            Réservez vos soins beauté
            <br />
            <span className="text-primary-foreground bg-gradient-to-r from-[#e8c1b7] via-[#d9a5a5] to-[#6c5ce7] bg-clip-text text-transparent">
              à domicile, en toute confiance.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-lg">
            ProBeauté connecte les meilleurs professionnels près de chez vous avec des clientes
            qui veulent gagner du temps sans sacrifier la qualité. Coiffure, ongles, make-up,
            soins du visage… choisissez, réservez, profitez.
          </p>

          {user ? (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                size="lg"
                className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-primary/40"
                onClick={() => navigate('/dashboard')}
              >
                Ouvrir mon dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                onClick={() => navigate('/services')}
              >
                Explorer les services
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                onClick={() => navigate('/reservations')}
              >
                Mes réservations
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-primary/40"
                onClick={handleClientClick}
              >
                Je suis cliente
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/60 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                onClick={handleProClick}
              >
                Je suis pro beauté
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
            <span>· RDV confirmés en quelques clics</span>
            <span>· Notes & avis clients</span>
            <span>· Paiement sécurisé</span>
          </div>
        </div>

        {/* Bloc droit : résumé mode connecté / non connecté */}
        <div className="rounded-2xl bg-card/90 backdrop-blur border border-white/10 p-5 sm:p-6 text-sm text-foreground shadow-xl">
          {user ? (
            <div className="space-y-4">
              <p className="text-xs font-medium text-primary tracking-wide uppercase">
                Bienvenue {user.firstName}
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                Vos espaces ProBeauté en un coup d’œil
              </h2>
              <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl bg-background/80 border border-border px-3 py-2 text-left hover:bg-background"
                  onClick={() => navigate('/dashboard')}
                >
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Dashboard</p>
                    <p className="text-xs text-muted-foreground">
                      Vue globale de vos réservations, messages et avis.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl bg-background/80 border border-border px-3 py-2 text-left hover:bg-background"
                  onClick={() => navigate('/services')}
                >
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Découvrir les services</p>
                    <p className="text-xs text-muted-foreground">
                      Parcourez les soins proches de chez vous.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl bg-background/80 border border-border px-3 py-2 text-left hover:bg-background"
                  onClick={() => navigate('/reservations')}
                >
                  <div>
                    <p className="font-medium text-foreground mb-0.5">Mes réservations</p>
                    <p className="text-xs text-muted-foreground">
                      Gérez vos prochains rendez-vous beauté.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs font-medium text-primary tracking-wide uppercase">
                Choisissez votre espace
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                Vous êtes plutôt cliente ou pro beauté ?
              </h2>
              <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                <div className="rounded-xl bg-background/80 border border-border p-3">
                  <p className="font-medium text-foreground mb-1">Espace cliente</p>
                  <p className="text-xs mb-3">
                    Réservez vos soins, suivez vos rendez-vous et retrouvez vos pros favoris.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate('/login?role=client')}
                    >
                      Me connecter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => navigate('/login?mode=signup&role=client')}
                    >
                      M’inscrire
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl bg-background/80 border border-border p-3">
                  <p className="font-medium text-foreground mb-1">Espace pro beauté</p>
                  <p className="text-xs mb-3">
                    Gérez vos disponibilités, vos réservations et développez votre clientèle.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate('/login?role=pro')}
                    >
                      Me connecter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => navigate('/login?mode=signup&role=pro')}
                    >
                      M’inscrire
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Les écrans d’inscription dédiés pourront être branchés sur ces boutons (client / pro).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hub combiné Services + Pros visible depuis la home */}
      <div className="relative border-t border-border/60 bg-background/80 px-6 pb-8 pt-6 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Explorer les pros & services autour de vous
            </h2>
            <p className="text-sm text-muted-foreground">
              Recherchez par mot-clé ou ville. Le détail complet est accessible après connexion.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              placeholder="Coupe, spa, ongles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Input
              className="sm:w-40"
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          {/* Services preview */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Services recommandés
            </h3>
            {services.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun service en base pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services
                  .filter((s) => {
                    const q = search.toLowerCase();
                    const inText =
                      !q ||
                      s.title.toLowerCase().includes(q) ||
                      (s.description || '').toLowerCase().includes(q);
                    return inText;
                  })
                  .slice(0, 4)
                  .map((service) => (
                    <ServiceCard
                      key={service._id}
                      service={service}
                      isFavorited={false}
                      isLiked={false}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Pros preview */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Professionnels à proximité
            </h3>
            {professionals.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun professionnel en base pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {professionals
                  .filter((p) => {
                    const q = search.toLowerCase();
                    const c = city.toLowerCase();
                    const inText =
                      !q ||
                      p.professionalName.toLowerCase().includes(q) ||
                      (p.specialty || '').toLowerCase().includes(q);
                    const inCity =
                      !c ||
                      (p.city || '').toLowerCase().includes(c) ||
                      (p.location || '').toLowerCase().includes(c);
                    return inText && inCity;
                  })
                  .slice(0, 3)
                  .map((pro) => (
                    <ProfessionalCard key={pro._id} professional={pro} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

