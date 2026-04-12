import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, Navigation, MapPin, Star, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { fetchProfessionals, type ApiProfessional } from '../api/client';

// Couleur par specialty
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

// Couleur unique par pro (hash sur l'id)
function getProAccent(id: string): string {
  const palette = ['#C9A84C','#ec4899','#f59e0b','#0ea5e9','#ef4444','#10b981','#F5D58B','#f97316','#06b6d4','#8B6914'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

// Filtre flexible specialty
function matchFilter(specialty: string, filter: string): boolean {
  if (filter === 'Tous') return true;
  const s = specialty.toLowerCase();
  const f = filter.toLowerCase();
  if (f === 'coiffeur') return s.includes('coiff');
  if (f === 'estheticienne') return s.includes('esth');
  if (f === 'onglerie') return s.includes('ongl') || s.includes('nail');
  if (f === 'barbier') return s.includes('barb');
  if (f === 'maquillage') return s.includes('maquil') || s.includes('makeup');
  if (f === 'massage') return s.includes('mass');
  return s.includes(f);
}

const FILTERS = ['Tous', 'Coiffeur', 'Estheticienne', 'Onglerie', 'Barbier', 'Maquillage', 'Massage'];

const DEMO_COORDS: [number, number][] = [
  [48.8566, 2.3522], [48.8448, 2.3735], [48.8751, 2.2958],
  [48.8329, 2.3707], [48.8618, 2.3294], [48.8465, 2.3000],
  [48.8700, 2.3400], [48.8520, 2.3800], [48.8600, 2.3100],
  [48.8680, 2.3650], [48.8390, 2.3550], [48.8490, 2.3200],
];

type MapPro = ApiProfessional & { lat: number; lng: number };

// Pin HTML avec photo circulaire ou initiale
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
    // Goutte
    '<div style="position:absolute;top:0;left:0;width:' + size + 'px;height:' + size + 'px;' +
    'background:' + color + ';' +
    'border-radius:50% 50% 50% 0;' +
    'transform:rotate(-45deg);' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.3);' +
    'border:3px solid white;"></div>' +
    // Photo/initiale centrée dans la goutte (pas rotée)
    '<div style="position:absolute;top:' + innerOffset + 'px;left:' + innerOffset + 'px;' +
    'width:' + innerSize + 'px;height:' + innerSize + 'px;border-radius:50%;overflow:hidden;' +
    'display:flex;align-items:center;justify-content:center;">' +
    inner +
    '</div>' +
    // Pointe bas
    '<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);' +
    'width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;' +
    'border-top:14px solid ' + color + ';"></div>' +
    '</div>'
  );
}

export function MapBeautePage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarker = useRef<any>(null);
  const [pros, setPros] = useState<MapPro[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [selected, setSelected] = useState<MapPro | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
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
      .finally(() => setLoading(false));
  }, []);

  const filtered = pros.filter(
    (p) =>
      matchFilter(p.specialty, filter) &&
      (!search ||
        p.professionalName.toLowerCase().includes(search.toLowerCase()) ||
        p.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  // Init carte + géolocalisation automatique au chargement
  useEffect(() => {
    let dead = false;
    import('leaflet').then((L) => {
      if (dead || !mapRef.current || mapInstance.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      // Démarre sur Paris par défaut, sera recentré si géoloc OK
      const map = L.map(mapRef.current!, { zoomControl: false }).setView([48.8566, 2.3522], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      mapInstance.current = map;
      setReady(true);

      // Géolocalisation automatique dès l'ouverture
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

            // Fit bounds : toi + les 5 pros les plus proches
            setPros((currentPros) => {
              const sorted = [...currentPros].sort((a, b) => {
                const da = Math.sqrt((a.lat - lat) ** 2 + (a.lng - lng) ** 2);
                const db = Math.sqrt((b.lat - lat) ** 2 + (b.lng - lng) ** 2);
                return da - db;
              });
              const nearby = sorted.slice(0, 5);
              const points: [number, number][] = [[lat, lng], ...nearby.map((p) => [p.lat, p.lng] as [number, number])];
              const bounds = L.latLngBounds(points);
              map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
              return currentPros;
            });

            setLocating(false);
          },
          () => setLocating(false),
          { timeout: 8000, maximumAge: 60000 }
        );
      }
    });
    return () => { dead = true; };
  }, []);

  // Markers avec photo
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
        const icon = L.divIcon({
          html,
          className: 'locbeaute-pin',
          iconSize: [46, 60],
          iconAnchor: [23, 60],
        });
        const m = L.marker([pro.lat, pro.lng], { icon }).addTo(mapInstance.current);
        m.on('click', () => { setSelected(pro); setImgError(false); });
        markers.current.push(m);
      });
    });
  }, [ready, filtered]);

  const placeUserMarker = (lat: number, lng: number) => {
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

      // Fit bounds : toi + les 5 pros les plus proches
      setPros((currentPros) => {
        const sorted = [...currentPros].sort((a, b) => {
          const da = Math.sqrt((a.lat - lat) ** 2 + (a.lng - lng) ** 2);
          const db = Math.sqrt((b.lat - lat) ** 2 + (b.lng - lng) ** 2);
          return da - db;
        });
        const nearby = sorted.slice(0, 5);
        const points: [number, number][] = [[lat, lng], ...nearby.map((p) => [p.lat, p.lng] as [number, number])];
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        return currentPros;
      });
    });
  };

  const showNearestPro = (lat: number, lng: number) => {
    if (pros.length === 0) return;
    let nearest = pros[0];
    let minDist = Infinity;
    pros.forEach((p) => {
      const d = Math.sqrt((p.lat - lat) ** 2 + (p.lng - lng) ** 2);
      if (d < minDist) { minDist = d; nearest = p; }
    });
    setSelected(nearest);
    setImgError(false);
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        placeUserMarker(lat, lng);
        showNearestPro(lat, lng);
        setLocating(false);
      },
      () => setLocating(false)
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

  return (
    <div className="fixed inset-0" style={{ top: 0, zIndex: 0 }}>
      {/* Barre flottante haut */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl shadow-lg px-3 py-2.5 border border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pro ou une specialite..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Carte */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Chargement */}
      {loading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm font-medium">Chargement des pros...</span>
          </div>
        </div>
      )}

      {/* Fiche pro */}
      {selected && (
        <div className="absolute bottom-24 left-4 right-4 z-[1000] md:bottom-8 md:left-auto md:right-8 md:w-80">
          <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="h-1.5" style={{ background: `linear-gradient(to right, ${proColor}, #ec4899)` }} />
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-md border border-border flex items-center justify-center"
                  style={{ backgroundColor: proColor }}>
                  {proPhoto && !imgError ? (
                    <img
                      key={selected._id}
                      src={proPhoto}
                      alt={selected.professionalName}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-white text-xl font-bold">{proInitial}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{selected.professionalName}</p>
                  <p className="text-sm text-muted-foreground">{selected.specialty}</p>
                  {selected.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                      Verifie
                    </span>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm mb-4 flex-wrap">
                {selected.ratingAverage > 0 && (
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {selected.ratingAverage.toFixed(1)}
                    <span className="text-muted-foreground font-normal">({selected.reviewsCount})</span>
                  </span>
                )}
                {selected.city && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {selected.city}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/professionals/' + selected._id)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
                >
                  Voir profil
                </button>
                <button
                  onClick={() => navigate('/booking?proId=' + selected._id)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: `linear-gradient(to right, ${proColor}, #ec4899)` }}
                >
                  Reserver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton localisation flottant sur la carte */}
      <button
        onClick={locate}
        className="absolute top-20 right-4 z-[1000] bg-white rounded-2xl shadow-lg p-3 border border-border hover:bg-accent active:scale-95 transition-all"
        title="Me localiser"
      >
        {locating ? (
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <Navigation className="h-6 w-6 text-primary" style={{ transform: 'rotate(45deg)' }} />
        )}
      </button>
    </div>
  );
}
