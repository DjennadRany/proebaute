import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, MapPin, Locate, Star, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const MOCK_PROS = [
  { id: '1', name: 'Marc Dubois', specialty: 'Coiffeur', lat: 48.8566, lng: 2.3522, rating: 4.8, city: 'Paris 8e', price: '35-80', available: true },
  { id: '2', name: 'Lea Bernard', specialty: 'Estheticienne', lat: 48.8448, lng: 2.3735, rating: 4.9, city: 'Paris 11e', price: '40-90', available: true },
  { id: '3', name: 'Nina Moreau', specialty: 'Onglerie', lat: 48.8751, lng: 2.2958, rating: 4.7, city: 'Paris 17e', price: '30-60', available: false },
  { id: '4', name: 'Karim Benali', specialty: 'Barbier', lat: 48.8329, lng: 2.3707, rating: 4.6, city: 'Paris 13e', price: '25-40', available: true },
  { id: '5', name: 'Sophie Laurent', specialty: 'Maquillage', lat: 48.8618, lng: 2.3294, rating: 4.5, city: 'Paris 9e', price: '50-120', available: true },
  { id: '6', name: 'Marie Petit', specialty: 'Massage', lat: 48.8465, lng: 2.3000, rating: 4.8, city: 'Paris 15e', price: '60-100', available: true },
];

const COLORS: Record<string, string> = {
  Coiffeur: '#7c3aed', Estheticienne: '#ec4899', Onglerie: '#f59e0b',
  Barbier: '#0ea5e9', Maquillage: '#ef4444', Massage: '#10b981',
};
const FILTERS = ['Tous', 'Coiffeur', 'Estheticienne', 'Onglerie', 'Barbier', 'Maquillage', 'Massage'];

type Pro = typeof MOCK_PROS[0];

export function MapBeautePage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [selected, setSelected] = useState<Pro | null>(null);
  const [ready, setReady] = useState(false);

  const filtered = MOCK_PROS.filter(p =>
    (filter === 'Tous' || p.specialty === filter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    let dead = false;
    import('leaflet').then(L => {
      if (dead || !mapRef.current || mapInstance.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      const map = L.map(mapRef.current!, { zoomControl: false }).setView([48.8566, 2.3522], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstance.current = map;
      setReady(true);
    });
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    import('leaflet').then(L => {
      markers.current.forEach(m => m.remove());
      markers.current = [];
      filtered.forEach(pro => {
        const color = COLORS[pro.specialty] ?? '#6b7280';
        const html = '<div style="width:28px;height:40px;background:' + color + ';border-radius:50% 50% 50% 0;transform:rotate(-45deg);opacity:' + (pro.available ? 1 : 0.4) + ';border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>';
        const icon = L.divIcon({ html, className: '', iconSize: [28, 40], iconAnchor: [14, 40] });
        const m = L.marker([pro.lat, pro.lng], { icon }).addTo(mapInstance.current);
        m.on('click', () => setSelected(pro));
        markers.current.push(m);
      });
    });
  }, [ready, filtered]);

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(p => {
      mapInstance.current?.setView([p.coords.latitude, p.coords.longitude], 14);
    });
  };

  return (
    <div className="fixed inset-0" style={{ top: 0, zIndex: 0 }}>
      {/* Barre flottante */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-lg px-3 py-2.5 border border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pro, une specialite..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
            {search && <button onClick={() => setSearch('')}><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          <button onClick={locate} className="bg-white rounded-xl shadow-lg p-2.5 border border-border hover:bg-violet-50">
            <Locate className="h-5 w-5 text-violet-600" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium shadow transition-all ' +
                (filter === f ? 'bg-violet-600 text-white' : 'bg-white text-foreground border border-border hover:border-violet-300')
              }>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Carte */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Carte pro */}
      {selected && (
        <div className="absolute bottom-24 left-4 right-4 z-[1000] md:bottom-8 md:left-auto md:right-8 md:w-80">
          <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="h-1.5" style={{ background: 'linear-gradient(to right, ' + (COLORS[selected.specialty] ?? '#7c3aed') + ', #ec4899)' }} />
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ backgroundColor: COLORS[selected.specialty] ?? '#7c3aed' }}>
                  {selected.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.specialty}</p>
                </div>
                <button onClick={() => setSelected(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="flex items-center gap-3 text-sm mb-4">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{selected.rating}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{selected.city}</span>
                <span className="text-muted-foreground">{selected.price} EUR</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/professionals/' + selected.id)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
                  Voir profil
                </button>
                <button
                  onClick={() => navigate('/booking?proId=' + selected.id)}
                  disabled={!selected.available}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #ec4899)' }}>
                  {selected.available ? 'Reserver' : 'Indispo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compteur */}
      <div className="absolute bottom-24 right-4 z-[1000] md:bottom-8 md:right-auto md:left-8">
        <div className="bg-white/90 backdrop-blur rounded-xl shadow px-3 py-2 text-xs border border-border text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> pro{filtered.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
