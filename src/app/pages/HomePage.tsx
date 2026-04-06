import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { BRANDED_LOGO_SRC } from '../constants/branding';
import { AppCard } from '../components/AppCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ApiProfessional, ApiService, fetchProfessionals, fetchServices } from '../api/client';
import { ServiceCard } from '../components/ServiceCard';
import { ProfessionalCard } from '../components/ProfessionalCard';

const HERO_SLIDES = [
  {
    title: 'Coiffure',
    caption: 'Brushing, coupe, coloration et soins capillaires.',
    image:
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    title: 'Barbe',
    caption: 'Taille précise, contour et rituels barber premium.',
    image:
      'https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    title: 'Esthétique',
    caption: 'Soin du visage, glow skin et mise en beauté.',
    image:
      'https://images.pexels.com/photos/5927793/pexels-photo-5927793.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    title: 'Ongles',
    caption: 'Manucure, nail art et finitions impeccables.',
    image:
      'https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    title: 'Épilation',
    caption: 'Prestations ciblées à domicile ou en institut.',
    image:
      'https://images.pexels.com/photos/6621461/pexels-photo-6621461.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Paris');
  const [services, setServices] = useState<ApiService[]>([]);
  const [professionals, setProfessionals] = useState<ApiProfessional[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchServices().catch(() => []),
      fetchProfessionals().catch(() => []),
    ]).then(([s, p]) => {
      setServices(s);
      setProfessionals(p);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);

    return () => window.clearInterval(timer);
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
    <div className="space-y-0">
      {/* Full-bleed hero aligned to RootLayout paddings (prevents mobile horizontal cut) */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === activeHeroIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="hero-slide-zoom h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="relative z-10 min-h-[520px] px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-18 text-white grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
        {/* Bloc gauche : texte principal */}
        <div className="space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-4 rounded-[28px] border border-white/35 bg-white/78 px-4 py-3 backdrop-blur">
            <img
              src={BRANDED_LOGO_SRC}
              alt="Logo LocBeauté"
              className="h-16 w-auto object-contain"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">
                LocBeauté
              </p>
              <p className="text-sm text-foreground/90">
                {HERO_SLIDES[activeHeroIndex].title} · {HERO_SLIDES[activeHeroIndex].caption}
              </p>
            </div>
          </div>
          <div className="inline-block rounded-[32px] bg-white/74 px-5 py-4 backdrop-blur-sm shadow-[0_20px_80px_rgba(255,255,255,0.45)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-foreground">
            Réservez vos soins beauté
            <br />
            <span className="text-primary-foreground bg-gradient-to-r from-[#e8c1b7] via-[#d9a5a5] to-[#6c5ce7] bg-clip-text text-transparent">
              à domicile, en toute confiance.
            </span>
          </h1>
          </div>
          <div className="inline-block max-w-lg rounded-[28px] bg-white/72 px-5 py-4 backdrop-blur-sm shadow-[0_18px_60px_rgba(255,255,255,0.35)]">
          <p className="text-sm sm:text-base text-foreground/80 max-w-lg">
            LocBeauté connecte les meilleurs professionnels près de chez vous avec des clientes
            qui veulent gagner du temps sans sacrifier la qualité. Coiffure, ongles, make-up,
            soins du visage… choisissez, réservez, profitez.
          </p>
          </div>

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
                className="rounded-full border-white/70 bg-white/70 px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-white/85"
                onClick={() => navigate('/services')}
              >
                Explorer les services
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/70 bg-white/70 px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-white/85"
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
                className="rounded-full border-white/70 bg-white/70 px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-white/85"
                onClick={handleProClick}
              >
                Je suis pro beauté
              </Button>
            </div>
          )}

          <div className="inline-flex flex-wrap items-center gap-4 rounded-full bg-white/72 px-4 py-2 text-xs text-foreground/70 backdrop-blur-sm">
            <span>· RDV confirmés en quelques clics</span>
            <span>· Notes & avis clients</span>
            <span>· Paiement sécurisé</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveHeroIndex(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur transition ${
                  index === activeHeroIndex
                    ? 'bg-white text-foreground'
                    : 'bg-white/65 text-foreground hover:bg-white/80'
                }`}
              >
                {slide.title}
              </button>
            ))}
          </div>
          <div className="grid max-w-lg gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/72 px-4 py-3 text-foreground shadow-[0_16px_50px_rgba(255,255,255,0.18)] backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">À domicile</p>
              <p className="mt-1 text-lg font-semibold">Prestations guidées</p>
            </div>
            <div className="rounded-2xl bg-white/72 px-4 py-3 text-foreground shadow-[0_16px_50px_rgba(255,255,255,0.18)] backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Confiance</p>
              <p className="mt-1 text-lg font-semibold">Avis & profils vérifiés</p>
            </div>
            <div className="rounded-2xl bg-white/72 px-4 py-3 text-foreground shadow-[0_16px_50px_rgba(255,255,255,0.18)] backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Mobile-first</p>
              <p className="mt-1 text-lg font-semibold">Réservation rapide</p>
            </div>
          </div>
        </div>

        {/* Bloc droit : résumé mode connecté / non connecté */}
        <AppCard tone="premium" className="rounded-[32px] bg-card/94 text-sm text-foreground shadow-xl">
          {user ? (
            <div className="space-y-4">
              <p className="text-xs font-medium text-primary tracking-wide uppercase">
                Bienvenue {user.firstName}
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                Vos espaces LocBeauté en un coup d'œil
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
                      M'inscrire
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
                      M'inscrire
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Les écrans d'inscription dédiés pourront être branchés sur ces boutons (client / pro).
              </p>
            </div>
          )}
        </AppCard>
      </div>
      </section>

      {/* Hub combiné Services + Pros visible depuis la home */}
      <div className="relative z-10 bg-background pb-8 pt-6">
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
              <div className="grid w-full grid-cols-1 justify-items-stretch gap-4 sm:grid-cols-2">
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
              <div className="w-full space-y-3">
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

