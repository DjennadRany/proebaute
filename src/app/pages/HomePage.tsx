import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, Navigation, MapPin, Star, X, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProfessionals, type ApiProfessional } from '../api/client';
import { Button } from '../components/ui/button';
import { useSEO } from '../hooks/useSEO';
import 'leaflet/dist/leaflet.css';

// ── Color helpers (same as MapBeautePage) ──────────────────────────────────
function getColor(specialty: string): string {
  const s = specialty.toLowerCase();
  if (s.includes('coiff')) return '#C9A84C';
  if (s.includes('esth')) return '#ec4899';
  if (s.includes('ongl') || s.includes('nail')) return '#f59e0b';
  if (s.includes('barb')) return '#0ea5e9';
  if (s.includes('maquil') || s.includes('makeup')) return '#ef4444';
  if (s.includes('mass')) return '#10b981';
  return '#8B6914';
}

function getProAccent(id: string): string {
  const palette = ['#C9A84C', '#ec4899', '#f59e0b', '#0ea5e9', '#ef4444', '#10b981', '#F5D58B', '#f97316', '#06b6d4', '#8B6914'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function makePinHtml(color: string, photo: string | null, initial: string): string {
  const size = 46;
  const innerSize = 36;
  const innerOffset = (size - innerSize) / 2;
  let inner: string;
  if (photo) {
    inner =
      '<img src="' + photo + '" ' +
      'style="width:' + innerSize + 'px;height:' + innerSize + 'px;border-radius:50%;' +
      'object-fit:cover;border:2px solid white;display:block;" ' +
      'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'"/>' +
      '<div style="display:none;width:' + innerSize + 'px;height:' + innerSize + 'px;' +
      'border-radius:50%;background:white;align-items:center;justify-content:center;' +
      'font-size:14px;font-weight:700;color:' + color + '">' + initial + '</div>';
  } else {
    inner =
      '<div style="width:' + innerSize + 'px;height:' + innerSize + 'px;' +
      'border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;' +
      'font-size:14px;font-weight:700;color:' + color + '">' + initial + '</div>';
  }
  return (
    '<div style="position:relative;width:' + size + 'px;height:' + (size + 14) + 'px;">' +
    '<div style="position:absolute;top:0;left:0;width:' + size + 'px;height:' + size + 'px;' +
    'background:' + color + ';border-radius:50% 50% 50% 0;transform:rotate(-45deg);' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid white;"></div>' +
    '<div style="position:absolute;top:' + innerOffset + 'px;left:' + innerOffset + 'px;' +
    'width:' + innerSize + 'px;height:' + innerSize + 'px;border-radius:50%;overflow:hidden;' +
    'display:flex;align-items:center;justify-content:center;">' +
    inner + '</div>' +
    '<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);' +
    'width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;' +
    'border-top:14px solid ' + color + ';"></div>' +
    '</div>'
  );
}

const DEMO_COORDS: [number, number][] = [
  [48.8566, 2.3522], [48.8448, 2.3735], [48.8751, 2.2958],
  [48.8329, 2.3707], [48.8618, 2.3294], [48.8465, 2.3000],
  [48.8700, 2.3400], [48.8520, 2.3800], [48.8600, 2.3100],
  [48.8680, 2.3650], [48.8390, 2.3550], [48.8490, 2.3200],
];

type MapPro = ApiProfessional & { lat: number; lng: number };

const CLIENT_FEATURES = [
  'Professionnels certifiés & notés',
  'Réservation en 2 clics, 24h/24',
  'Paiement sécurisé en ligne',
  'Annulation flexible',
];

const PRO_FEATURES = [
  'Agenda en ligne automatisé',
  'Visibilité géolocalisée',
  'Paiements directs & sécurisés',
  'Statistiques & avis clients',
];

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://locbeaute.com/#organization',
      name: 'LocBeauté',
      url: 'https://locbeaute.com',
      logo: { '@type': 'ImageObject', url: 'https://locbeaute.com/asset/locbeaute_logo.png' },
      description: 'Plateforme de réservation de soins beauté à domicile en France',
      areaServed: { '@type': 'Country', name: 'France' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://locbeaute.com/#website',
      url: 'https://locbeaute.com',
      name: 'LocBeauté',
      publisher: { '@id': 'https://locbeaute.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://locbeaute.com/professionals?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'fr-FR',
    },
  ],
};

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user) {
      navigate(user.role === 'professional' ? '/pro/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useSEO({
    title: 'Réservez vos soins beauté à domicile',
    description: 'LocBeauté connecte clientes et professionnels beauté. Coiffure, ongles, esthétique, make-up à domicile ou en salon — réservez en 2 clics, partout en France.',
    canonical: 'https://locbeaute.com/',
    jsonLd: HOME_JSON_LD,
  });

  // ── Map state ──────────────────────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarker = useRef<any>(null);
  const [pros, setPros] = useState<MapPro[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MapPro | null>(null);
  const [ready, setReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchProfessionals()
      .then((data) => {
        const withCoords: MapPro[] = data.map((p, i) => ({
          ...p,
          lat: p.coordinates?.lat ?? DEMO_COORDS[i % DEMO_COORDS.length][0],
          lng: p.coordinates?.lng ?? DEMO_COORDS[i % DEMO_COORDS.length][1],
        }));
        setPros(withCoords);
      })
      .catch(() => setPros([]))
      .finally(() => setMapLoading(false));
  }, []);

  useEffect(() => {
    let dead = false;
    import('leaflet').then((L) => {
      if (dead || !mapRef.current || mapInstance.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map(mapRef.current!, { zoomControl: false }).setView([48.8566, 2.3522], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      mapInstance.current = map;
      setReady(true);

      if (navigator.geolocation) {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (dead) return;
            const { latitude: lat, longitude: lng } = pos.coords;
            const html =
              '<div style="position:relative;width:22px;height:22px;">' +
              '<div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.3;animation:locpulse 1.5s ease-out infinite;"></div>' +
              '<div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.7);"></div>' +
              '</div>';
            const icon = L.divIcon({ html, className: 'locbeaute-pin', iconSize: [22, 22], iconAnchor: [11, 11] });
            if (userMarker.current) userMarker.current.remove();
            userMarker.current = L.marker([lat, lng], { icon }).addTo(map);
            setPros((currentPros) => {
              const sorted = [...currentPros].sort((a, b) => {
                const da = Math.sqrt((a.lat - lat) ** 2 + (a.lng - lng) ** 2);
                const db = Math.sqrt((b.lat - lat) ** 2 + (b.lng - lng) ** 2);
                return da - db;
              });
              const nearby = sorted.slice(0, 5);
              const points: [number, number][] = [[lat, lng], ...nearby.map((p) => [p.lat, p.lng] as [number, number])];
              map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 14 });
              return currentPros;
            });
            setLocating(false);
          },
          () => setLocating(false),
          { timeout: 8000, maximumAge: 60000 },
        );
      }
    });
    return () => { dead = true; };
  }, []);

  const filtered = pros.filter(
    (p) =>
      !search ||
      p.professionalName.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    import('leaflet').then((L) => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      filtered.forEach((pro) => {
        const color = pro.gallery?.[0] ? getColor(pro.specialty) : getProAccent(pro._id);
        const photo = pro.gallery?.[0] ?? null;
        const name = pro.professionalName ?? '';
        const words = name.trim().split(/\s+/);
        const initial = words.length >= 2
          ? (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
          : name.charAt(0).toUpperCase();
        const html = makePinHtml(color, photo, initial);
        const icon = L.divIcon({ html, className: 'locbeaute-pin', iconSize: [46, 60], iconAnchor: [23, 60] });
        const m = L.marker([pro.lat, pro.lng], { icon }).addTo(mapInstance.current);
        m.on('click', () => { setSelected(pro); setImgError(false); });
        markers.current.push(m);
      });
    });
  }, [ready, filtered]);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        import('leaflet').then((L) => {
          const map = mapInstance.current;
          if (!map) return;
          if (userMarker.current) userMarker.current.remove();
          const html =
            '<div style="position:relative;width:22px;height:22px;">' +
            '<div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.3;animation:locpulse 1.5s ease-out infinite;"></div>' +
            '<div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.7);"></div>' +
            '</div>';
          const icon = L.divIcon({ html, className: 'locbeaute-pin', iconSize: [22, 22], iconAnchor: [11, 11] });
          userMarker.current = L.marker([lat, lng], { icon }).addTo(map);
          map.flyTo([lat, lng], 13, { duration: 1.2 });
        });
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  const proPhoto = selected?.gallery?.[0] ?? null;
  const proColor = selected
    ? (proPhoto ? getColor(selected.specialty) : getProAccent(selected._id))
    : '#C9A84C';
  const proName = selected?.professionalName ?? '';
  const proWords = proName.trim().split(/\s+/);
  const proInitial = proWords.length >= 2
    ? (proWords[0].charAt(0) + proWords[1].charAt(0)).toUpperCase()
    : proName.charAt(0).toUpperCase();

  const handleViewProfile = () => {
    if (!selected) return;
    if (!user) { navigate('/login'); return; }
    navigate('/professionals/' + selected._id);
  };

  const handleBook = () => {
    if (!selected) return;
    if (!user) { navigate('/login'); return; }
    navigate('/booking?proId=' + selected._id);
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">

      {/* ── HERO compact ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 bg-background">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-2">
            Trouvez votre expert beauté{' '}
            <span className="gold-text">près de chez vous</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Coiffure, ongles, esthétique, make-up — réservez à domicile ou en salon, en quelques secondes.
          </p>
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm max-w-lg">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pro ou une spécialité..."
              className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── EMBEDDED MAP ───────────────────────────────────────────────────── */}
      <section
        className="relative w-full"
        style={{ height: '60vh', minHeight: '320px', maxHeight: '600px' }}
        aria-label="Carte des professionnels de beauté"
      >
        {/* Map tile */}
        <div ref={mapRef} className="absolute inset-0" />

        {/* Loading overlay */}
        {mapLoading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3 border border-border">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm font-medium text-foreground">Chargement des pros...</span>
            </div>
          </div>
        )}

        {/* Locate button */}
        <button
          onClick={locate}
          className="absolute top-4 right-4 z-[1000] bg-white rounded-2xl shadow-lg p-3 border border-border hover:bg-accent active:scale-95 transition-all"
          title="Me localiser"
        >
          {locating ? (
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <Navigation className="h-5 w-5 text-primary" style={{ transform: 'rotate(45deg)' }} />
          )}
        </button>

        {/* Pro panel */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] md:left-auto md:right-4 md:w-80">
            <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="h-1.5" style={{ background: `linear-gradient(to right, ${proColor}, #ec4899)` }} />
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-border flex items-center justify-center"
                    style={{ backgroundColor: proColor }}
                  >
                    {proPhoto && !imgError ? (
                      <img
                        key={selected._id}
                        src={proPhoto}
                        alt={selected.professionalName}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <span className="text-white text-lg font-bold">{proInitial}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{selected.professionalName}</p>
                    <p className="text-sm text-gray-500">{selected.specialty}</p>
                    {selected.ratingAverage > 0 && (
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-700 mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {selected.ratingAverage.toFixed(1)}
                        <span className="text-gray-400 font-normal text-xs">({selected.reviewsCount})</span>
                      </span>
                    )}
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {selected.city && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <MapPin className="h-3 w-3" /> {selected.city}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleViewProfile}
                    className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    Voir profil
                  </button>
                  <button
                    onClick={handleBook}
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                    style={{ background: `linear-gradient(to right, ${proColor}, #C9A84C)` }}
                  >
                    Réserver
                  </button>
                </div>

                {!user && (
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    Connexion requise pour réserver
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── CLIENT BANNER ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        <img
          src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1260"
          alt="Professionnelle de beauté au travail"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-10 lg:px-16 py-12 sm:py-16 max-w-lg">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Pour les clientes
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">
            Votre beauté,{' '}
            <span className="gold-text">à domicile ou en salon</span>
          </h2>
          <p className="text-sm sm:text-base text-white/75 mb-6 leading-relaxed">
            Parcourez des centaines de professionnels vérifiés près de chez vous.
            Choisissez, réservez, profitez — sans stress et sans attente.
          </p>
          <ul className="space-y-2 mb-8">
            {CLIENT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/85">
                <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="rounded-full gold-bg text-black font-semibold px-6 shadow-lg"
              onClick={() => navigate('/login?mode=signup&role=client')}
            >
              Rejoindre LocBeauté
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <button
              onClick={() => navigate('/login?role=client')}
              className="text-sm text-white/70 hover:text-white underline underline-offset-4 self-center transition-colors"
            >
              Déjà membre ? Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* ── PRO BANNER ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        <img
          src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1260"
          alt="Barbier professionnel en activité"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-10 lg:px-16 py-12 sm:py-16 max-w-lg ml-auto text-right">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Pour les professionnels
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">
            Développez votre{' '}
            <span className="gold-text">clientèle en ligne</span>
          </h2>
          <p className="text-sm sm:text-base text-white/75 mb-6 leading-relaxed">
            Gérez votre agenda, vos réservations et vos paiements depuis une seule application.
            Gagnez en visibilité géolocalisée dès le premier jour.
          </p>
          <ul className="space-y-2 mb-8 items-end">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center justify-end gap-2 text-sm text-white/85">
                {f}
                <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row-reverse gap-3">
            <Button
              size="lg"
              className="rounded-full gold-bg text-black font-semibold px-6 shadow-lg"
              onClick={() => navigate('/login?mode=signup&role=pro')}
            >
              Créer mon espace pro
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <button
              onClick={() => navigate('/login?role=pro')}
              className="text-sm text-white/70 hover:text-white underline underline-offset-4 self-center transition-colors"
            >
              Déjà inscrit ? Me connecter
            </button>
          </div>
        </div>
      </section>

      {/* ── SEO CONTENT (crawlable) ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-8 text-center">
            Comment fonctionne LocBeauté ?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full gold-bg flex items-center justify-center mx-auto text-black font-bold text-lg">1</div>
              <h3 className="font-semibold text-foreground text-base">Cherchez</h3>
              <p className="text-sm text-muted-foreground">Trouvez un coiffeur, esthéticienne, nail artist ou barbier près de chez vous sur la carte interactive.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full gold-bg flex items-center justify-center mx-auto text-black font-bold text-lg">2</div>
              <h3 className="font-semibold text-foreground text-base">Réservez</h3>
              <p className="text-sm text-muted-foreground">Choisissez un créneau disponible, confirmez en ligne. Pas de téléphone, pas d'attente.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full gold-bg flex items-center justify-center mx-auto text-black font-bold text-lg">3</div>
              <h3 className="font-semibold text-foreground text-base">Profitez</h3>
              <p className="text-sm text-muted-foreground">Le professionnel se déplace ou vous accueille. Payez en ligne, laissez un avis. Simple et sécurisé.</p>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-10">
            LocBeauté · Réservation beauté à domicile en France ·{' '}
            <a href="/professionals" className="underline hover:text-primary transition-colors">Trouver un professionnel</a>
            {' · '}
            <a href="/services" className="underline hover:text-primary transition-colors">Voir les services</a>
          </p>
        </div>
      </section>

    </div>
  );
}
