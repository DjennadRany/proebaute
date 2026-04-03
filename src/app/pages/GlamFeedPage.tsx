import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart, MessageCircle, Share2, Bookmark, Star, MapPin, ChevronRight } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

const FEED_POSTS = [
  {
    id: '1',
    proId: '1',
    proName: 'Marc Dubois',
    proSpecialty: 'Coiffeur',
    proCity: 'Paris 8e',
    proRating: 4.8,
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Balayage californien sur cheveux chatains. Resultat naturel et lumineux! Disponible pour vos reservations ce weekend.',
    likes: 142,
    comments: 23,
    tag: 'Balayage',
    price: 80,
    liked: false,
    saved: false,
  },
  {
    id: '2',
    proId: '2',
    proName: 'Lea Bernard',
    proSpecialty: 'Estheticienne',
    proCity: 'Paris 11e',
    proRating: 4.9,
    image: 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Soin visage hydratant + massage cranien offert. Peau eclatante garantie! Je me deplace a domicile sur Paris et proche banlieue.',
    likes: 89,
    comments: 12,
    tag: 'Soin visage',
    price: 65,
    liked: false,
    saved: false,
  },
  {
    id: '3',
    proId: '4',
    proName: 'Karim Benali',
    proSpecialty: 'Barbier',
    proCity: 'Paris 13e',
    proRating: 4.6,
    image: 'https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Barbe sculptee + degrade skin fade. Le combo parfait pour un look soigne. Places disponibles cette semaine!',
    likes: 203,
    comments: 31,
    tag: 'Barbe & Coiffure',
    price: 45,
    liked: false,
    saved: false,
  },
  {
    id: '4',
    proId: '5',
    proName: 'Sophie Laurent',
    proSpecialty: 'Maquillage',
    proCity: 'Paris 9e',
    proRating: 4.5,
    image: 'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Maquillage de mariee naturel et durable. Portfolio disponible sur demande. Reservez votre date maintenant!',
    likes: 317,
    comments: 45,
    tag: 'Mariage',
    price: 120,
    liked: false,
    saved: false,
  },
  {
    id: '5',
    proId: '3',
    proName: 'Nina Moreau',
    proSpecialty: 'Onglerie',
    proCity: 'Paris 17e',
    proRating: 4.7,
    image: 'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Pose gel avec nail art floral tendance printemps. Tenue garantie 3 semaines. Je me deplace ou vous venez en salon!',
    likes: 178,
    comments: 28,
    tag: 'Nail Art',
    price: 55,
    liked: false,
    saved: false,
  },
];

const CATEGORIES = ['Tout', 'Coiffure', 'Ongles', 'Esthetique', 'Barbe', 'Maquillage', 'Massage'];

export function GlamFeedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(FEED_POSTS);
  const [activeCategory, setActiveCategory] = useState('Tout');

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  return (
    <div className="pb-6">
      <AppHeader eyebrow="Inspiration" title="GlamFeed" subtitle="Decouvrez les creations des pros pres de vous" />

      {/* Filtres categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ' +
              (activeCategory === cat
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:text-foreground')
            }>
            {cat}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Header pro */}
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {post.proName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{post.proName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{post.proSpecialty}</span>
                  <span>•</span>
                  <MapPin className="h-3 w-3" />
                  <span>{post.proCity}</span>
                  <span>•</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{post.proRating}</span>
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                {post.tag}
              </span>
            </div>

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={post.image} alt={post.tag} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <span className="text-white font-bold text-lg">{post.price} EUR</span>
                <button
                  onClick={() => navigate('/booking?proId=' + post.proId)}
                  className="bg-white text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors">
                  Reserver
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-4 mb-3">
                <button onClick={() => toggleLike(post.id)} className={'flex items-center gap-1.5 text-sm transition-colors ' + (post.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400')}>
                  <Heart className={'h-5 w-5 ' + (post.liked ? 'fill-current' : '')} />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  <Share2 className="h-5 w-5" />
                </button>
                <button onClick={() => toggleSave(post.id)} className={'ml-auto transition-colors ' + (post.saved ? 'text-violet-600' : 'text-muted-foreground hover:text-violet-500')}>
                  <Bookmark className={'h-5 w-5 ' + (post.saved ? 'fill-current' : '')} />
                </button>
              </div>
              <p className="text-sm text-foreground mb-3">
                <span className="font-semibold">{post.proName}</span>{' '}
                {post.caption}
              </p>
              <button
                onClick={() => navigate('/professionals/' + post.proId)}
                className="flex items-center gap-1 text-xs text-violet-600 font-medium hover:underline mb-3">
                Voir le profil complet <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
