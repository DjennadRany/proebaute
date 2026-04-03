import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Heart, MessageCircle, Bookmark, Star, MapPin, Share2 } from 'lucide-react';
import { fetchProfessionals, fetchServices, type ApiProfessional, type ApiService } from '../api/client';

// Images beauté Pexels fallback si le service n'a pas de media
const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5927793/pexels-photo-5927793.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/6621461/pexels-photo-6621461.jpeg?auto=compress&cs=tinysrgb&w=800',
];

function getProAccent(id: string): string {
  const palette = ['#7c3aed', '#ec4899', '#f59e0b', '#0ea5e9', '#ef4444', '#10b981', '#8b5cf6', '#f97316'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

type FeedItem = {
  id: string;
  service: ApiService;
  pro: ApiProfessional | undefined;
  image: string;
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: number;
};

function isVideo(url: string): boolean {
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

function ReelCard({ item, onLike, onSave }: {
  item: FeedItem;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const proName = item.pro?.professionalName ?? 'Pro LocBeaute';
  const proInitials = proName.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const proColor = item.pro ? getProAccent(item.pro._id) : '#7c3aed';
  const proPhoto = item.pro?.gallery?.[0] ?? null;
  const city = item.pro?.city ?? '';
  const rating = item.pro?.ratingAverage ?? 0;
  const mediaUrl = imgFailed ? FALLBACK_IMAGES[Math.abs(item.id.charCodeAt(0) || 0) % FALLBACK_IMAGES.length] : item.image;
  const isVid = !imgFailed && isVideo(item.image);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.service.title, url: window.location.origin + '/services/' + item.service._id });
    }
  };

  return (
    <div className="relative w-full bg-black" style={{ height: 'calc(100svh - 120px)', minHeight: 480, maxHeight: 780 }}>
      {/* Media plein ecran - video ou image */}
      {isVid ? (
        <video
          src={item.image}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          onError={() => setImgFailed(true)}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={item.service.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      )}

      {/* Gradient bas */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Gradient haut leger */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-24" />

      {/* Infos pro en haut a gauche */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0">
          {proPhoto ? (
            <img src={proPhoto} alt={proName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: proColor }}>
              {proInitials}
            </div>
          )}
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight drop-shadow">{proName}</p>
          <div className="flex items-center gap-1 text-white/80 text-[11px]">
            {city && <><MapPin className="h-3 w-3" /><span>{city}</span></>}
            {rating > 0 && <><span>•</span><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span>{rating.toFixed(1)}</span></>}
          </div>
        </div>
      </div>

      {/* Actions verticales droite */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={() => onLike(item.id)} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm ${item.liked ? 'bg-red-500' : 'bg-white/20 border border-white/30'}`}>
            <Heart className={`h-5 w-5 ${item.liked ? 'fill-white text-white' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">{item.likes}</span>
        </button>

        {/* Commentaire */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">{item.comments}</span>
        </button>

        {/* Sauvegarder */}
        <button onClick={() => onSave(item.id)} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm ${item.saved ? 'bg-violet-600' : 'bg-white/20 border border-white/30'}`}>
            <Bookmark className={`h-5 w-5 ${item.saved ? 'fill-white text-white' : 'text-white'}`} />
          </div>
        </button>

        {/* Partager */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-5 w-5 text-white" />
          </div>
        </button>
      </div>

      {/* Infos service + prix en bas */}
      <div className="absolute bottom-4 left-4 right-16">
        {/* Badge categorie */}
        <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: proColor + 'cc' }}>
          {item.service.category}
        </span>

        {/* Titre */}
        <h3 className="text-white font-bold text-lg leading-tight drop-shadow mb-1">{item.service.title}</h3>

        {/* Description */}
        {item.service.description && (
          <p className="text-white/80 text-xs leading-snug mb-3 line-clamp-2">{item.service.description}</p>
        )}

        {/* Prix + bouton reserver */}
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-2xl drop-shadow">{item.service.price} €</span>
          {item.service.duration > 0 && (
            <span className="text-white/70 text-xs">{item.service.duration} min</span>
          )}
          <button
            onClick={() => navigate('/booking?serviceId=' + item.service._id + (item.pro ? '&proId=' + item.pro._id : ''))}
            className="ml-auto px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg"
            style={{ background: `linear-gradient(to right, ${proColor}, #ec4899)` }}
          >
            Reserver
          </button>
        </div>
      </div>
    </div>
  );
}

export function GlamFeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetchProfessionals(), fetchServices()])
      .then(([proList, serviceList]) => {
        const proMap: Record<string, ApiProfessional> = {};
        proList.forEach((p) => { proMap[p._id] = p; });

        const items: FeedItem[] = serviceList
          .map((s) => {
            const pro = proMap[s.professionalId];
            // Photo : media du service OU gallery du pro — sinon on n'affiche pas
            const media =
              (s.media && s.media.length > 0 ? s.media[0] : null) ??
              (pro?.gallery && pro.gallery.length > 0 ? pro.gallery[0] : null) ??
              null;
            if (!media) return null; // pas de photo = pas dans le feed
            return {
              id: s._id,
              service: s,
              pro,
              image: media,
              liked: false,
              saved: false,
              likes: s.likesCount > 0 ? s.likesCount : Math.floor(Math.random() * 200) + 20,
              comments: s.reviewsCount > 0 ? s.reviewsCount : Math.floor(Math.random() * 40) + 2,
            };
          })
          .filter((x): x is FeedItem => x !== null);

        // Fallback uniquement si Supabase ne retourne rien du tout
        if (items.length === 0) {
          setFeed(FALLBACK_IMAGES.map((img, i) => ({
            id: 'demo-' + i,
            service: { _id: String(i), professionalId: '', title: 'Prestation beaute', description: 'Demo - ajoutez vos services dans Supabase', category: 'Beaute', price: 50 + i * 10, duration: 60, media: [], ratingAverage: 4.5, likesCount: 0, reviewsCount: 0 },
            pro: undefined,
            image: img,
            liked: false,
            saved: false,
            likes: 50 + i * 20,
            comments: 5 + i * 3,
          })));
        } else {
          setFeed(items);
        }
      })
      .catch(() => setFeed([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = (id: string) => {
    setFeed((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (id: string) => {
    setFeed((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-6 w-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-0.5 -mx-4 -mt-4 sm:-mx-6 lg:-mx-8">
      {feed.map((item) => (
        <ReelCard key={item.id} item={item} onLike={toggleLike} onSave={toggleSave} />
      ))}
    </div>
  );
}
