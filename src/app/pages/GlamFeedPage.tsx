import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Heart, MessageCircle, Bookmark, Share2, X, Send,
  ChevronUp, Plus, Camera,
} from 'lucide-react';
import {
  fetchProfessionals,
  fetchServices,
  fetchLikes,
  fetchFavorites,
  toggleLike as apiToggleLike,
  toggleFavorite as apiToggleFavorite,
  type ApiProfessional,
  type ApiService,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabaseClient';

// ─── helpers ────────────────────────────────────────────────────────────────

function getAccent(id: string): string {
  const p = ['#7c3aed','#ec4899','#f59e0b','#0ea5e9','#ef4444','#10b981','#8b5cf6','#f97316'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return p[h % p.length];
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

const BEAUTY_IMGS = [
  'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5927793/pexels-photo-5927793.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/6621461/pexels-photo-6621461.jpeg?auto=compress&cs=tinysrgb&w=800',
];

// ─── types ──────────────────────────────────────────────────────────────────

type Comment = { id: string; author: string; text: string; createdAt: string };

type FeedItem = {
  id: string;
  service: ApiService;
  pro: ApiProfessional | undefined;
  image: string;
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: number;
  commentList: Comment[];
  commentsLoaded: boolean;
};

// ─── CommentDrawer ───────────────────────────────────────────────────────────

function CommentDrawer({
  item,
  onClose,
  onAddComment,
  user,
}: {
  item: FeedItem;
  onClose: () => void;
  onAddComment: (serviceId: string, text: string) => Promise<void>;
  user: { _id: string; firstName: string; lastName: string } | null;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [item.commentList.length]);

  const submit = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    await onAddComment(item.id, text.trim());
    setText('');
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card rounded-t-3xl flex flex-col max-h-[70vh] shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <h3 className="font-semibold text-sm">{item.comments} commentaire{item.comments !== 1 ? 's' : ''}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {item.commentList.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Soyez le premier a commenter !</p>
          ) : (
            item.commentList.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{c.author}</p>
                  <p className="text-sm text-foreground mt-0.5">{c.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user ? (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase() : '?'}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={user ? 'Ajouter un commentaire...' : 'Connectez-vous pour commenter'}
            disabled={!user}
            className="flex-1 text-sm bg-muted rounded-full px-4 py-2 outline-none border border-border focus:border-violet-400"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || sending || !user}
            className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center disabled:opacity-40"
          >
            {sending
              ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send className="h-4 w-4 text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ReelCard ────────────────────────────────────────────────────────────────

function ReelCard({
  item,
  onLike,
  onSave,
  onComment,
  user,
}: {
  item: FeedItem;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (item: FeedItem) => void;
  user: { _id: string; firstName: string; lastName: string } | null;
}) {
  const navigate = useNavigate();
  const [mediaBroken, setMediaBroken] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const lastTap = useRef(0);

  const proName = item.pro?.professionalName ?? 'Pro LocBeaute';
  const proWords = proName.trim().split(/\s+/);
  const proInitials = (proWords[0]?.[0] ?? '') + (proWords[1]?.[0] ?? '');
  const proColor = item.pro ? getAccent(item.pro._id) : '#7c3aed';
  const proPhoto = item.pro?.gallery?.[0] ?? null;
  const fallback = BEAUTY_IMGS[Math.abs((item.id.charCodeAt(0) || 0) + (item.id.charCodeAt(1) || 0)) % BEAUTY_IMGS.length];
  const mediaUrl = mediaBroken ? fallback : item.image;
  const isVid = !mediaBroken && isVideo(item.image);

  // Double-tap pour liker
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onLike(item.id);
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 800);
    }
    lastTap.current = now;
  }, [item.id, onLike]);

  const handleShare = () => {
    const url = window.location.origin + '/services/' + item.service._id;
    if (navigator.share) {
      navigator.share({ title: item.service.title, text: item.service.description, url });
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <div
      className="relative w-full bg-black select-none"
      style={{ height: 'calc(100svh - 116px)', minHeight: 500 }}
      onClick={handleTap}
    >
      {/* Media */}
      {isVid ? (
        <video
          src={mediaUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay loop muted playsInline
          onError={() => setMediaBroken(true)}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={item.service.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setMediaBroken(true)}
          loading="lazy"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* Animation coeur double-tap */}
      {likeAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl animate-ping" style={{ animationDuration: '0.6s', animationIterationCount: 1 }} />
        </div>
      )}

      {/* Pro info haut gauche — cliquable */}
      <button
        className="absolute top-4 left-4 flex items-center gap-2.5 z-10"
        onClick={(e) => {
          e.stopPropagation();
          if (item.pro) navigate('/professionals/' + item.pro._id);
        }}
      >
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-lg shrink-0">
          {proPhoto ? (
            <img
              src={proPhoto}
              alt={proName}
              className="w-full h-full object-cover"
              onError={(ev) => { (ev.currentTarget.parentElement as HTMLElement).style.backgroundColor = proColor; ev.currentTarget.remove(); }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: proColor }}>
              {proInitials.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="text-left">
          <p className="text-white text-sm font-bold leading-tight drop-shadow">{proName}</p>
          {item.pro?.city && (
            <p className="text-white/75 text-[11px] leading-tight">{item.pro.city}</p>
          )}
        </div>
        {/* Badge suivre */}
        <span className="ml-1 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/40 text-white text-[11px] font-semibold backdrop-blur-sm">
          Voir profil
        </span>
      </button>

      {/* Actions droite */}
      <div
        className="absolute right-3 bottom-36 flex flex-col items-center gap-5 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Like */}
        <button onClick={() => onLike(item.id)} className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${item.liked ? 'bg-red-500 scale-110' : 'bg-white/20 border border-white/30 backdrop-blur-sm'}`}>
            <Heart className={`h-6 w-6 transition-all ${item.liked ? 'fill-white text-white scale-110' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{item.likes > 999 ? (item.likes / 1000).toFixed(1) + 'k' : item.likes}</span>
        </button>

        {/* Commentaire */}
        <button onClick={() => onComment(item)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{item.comments}</span>
        </button>

        {/* Sauvegarder */}
        <button onClick={() => onSave(item.id)} className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${item.saved ? 'bg-violet-600 scale-110' : 'bg-white/20 border border-white/30 backdrop-blur-sm'}`}>
            <Bookmark className={`h-6 w-6 ${item.saved ? 'fill-white text-white' : 'text-white'}`} />
          </div>
        </button>

        {/* Partage */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <Share2 className="h-6 w-6 text-white" />
          </div>
        </button>
      </div>

      {/* Infos bas */}
      <div className="absolute bottom-4 left-4 right-16 z-10" onClick={(e) => e.stopPropagation()}>
        {/* Categorie badge */}
        <span
          className="inline-block mb-2 px-3 py-0.5 rounded-full text-[11px] font-bold text-white shadow"
          style={{ backgroundColor: proColor + 'dd' }}
        >
          {item.service.category}
        </span>

        {/* Titre */}
        <h3 className="text-white font-extrabold text-xl leading-tight drop-shadow-lg mb-1">
          {item.service.title}
        </h3>

        {/* Description */}
        {item.service.description && (
          <p className="text-white/80 text-xs leading-snug mb-3 line-clamp-2">{item.service.description}</p>
        )}

        {/* Prix + Reserver */}
        <div className="flex items-center gap-3">
          <div>
            <span className="text-white font-black text-2xl drop-shadow-lg">{item.service.price} €</span>
            {item.service.duration > 0 && (
              <span className="text-white/60 text-xs ml-1">{item.service.duration}min</span>
            )}
          </div>
          <button
            onClick={() => navigate('/booking?serviceId=' + item.service._id + (item.pro ? '&proId=' + item.pro._id : ''))}
            className="ml-auto px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-xl active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${proColor}, #ec4899)` }}
          >
            Reserver
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40 pointer-events-none">
        <ChevronUp className="h-4 w-4 text-white animate-bounce" />
      </div>
    </div>
  );
}

// ─── GlamFeedPage ─────────────────────────────────────────────────────────────

export function GlamFeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentItem, setCommentItem] = useState<FeedItem | null>(null);

  useEffect(() => {
    const likedIds = new Set<string>();
    const savedIds = new Set<string>();

    Promise.all([
      fetchProfessionals(),
      fetchServices(),
      user ? fetchLikes(user._id) : Promise.resolve([]),
      user ? fetchFavorites(user._id) : Promise.resolve([]),
    ]).then(([proList, serviceList, likesList, favoritesList]) => {
      likesList.forEach((l) => { if (l.serviceId) likedIds.add(l.serviceId); });
      favoritesList.forEach((f) => savedIds.add(f.targetId));

      const proMap: Record<string, ApiProfessional> = {};
      proList.forEach((p) => { proMap[p._id] = p; });

      const items: FeedItem[] = serviceList
        .map((s) => {
          const pro = proMap[s.professionalId];
          const media =
            (s.media?.length ? s.media[0] : null) ??
            (pro?.gallery?.length ? pro.gallery[0] : null) ??
            null;
          if (!media) return null;
          return {
            id: s._id,
            service: s,
            pro,
            image: media,
            liked: likedIds.has(s._id),
            saved: savedIds.has(s._id),
            likes: s.likesCount,
            comments: s.reviewsCount,
            commentList: [],
            commentsLoaded: false,
          };
        })
        .filter((x): x is FeedItem => x !== null);

      setFeed(items);
    }).catch(() => setFeed([])).finally(() => setLoading(false));
  }, [user]);

  // Charger commentaires depuis Supabase
  const loadComments = async (serviceId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('id, comment, rating, created_at, users:client_id (first_name, last_name)')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .limit(50);

    const list: Comment[] = (data ?? []).map((r: any) => ({
      id: r.id,
      author: r.users ? `${r.users.first_name ?? ''} ${r.users.last_name ?? ''}`.trim() : 'Anonyme',
      text: r.comment ?? '',
      createdAt: r.created_at,
    })).filter((c) => c.text);

    setFeed((prev) => prev.map((p) =>
      p.id === serviceId ? { ...p, commentList: list, commentsLoaded: true } : p
    ));
  };

  const handleOpenComment = async (item: FeedItem) => {
    if (!item.commentsLoaded) await loadComments(item.id);
    setCommentItem((prev) => (prev?.id === item.id ? null : feed.find((f) => f.id === item.id) ?? item));
  };

  // Sync commentItem avec feed
  useEffect(() => {
    if (commentItem) {
      const updated = feed.find((f) => f.id === commentItem.id);
      if (updated) setCommentItem(updated);
    }
  }, [feed]);

  const handleAddComment = async (serviceId: string, text: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('reviews')
      .insert({
        service_id: serviceId,
        client_id: user._id,
        comment: text,
        rating: 5,
      })
      .select('id, created_at')
      .single();

    if (data) {
      const newComment: Comment = {
        id: data.id,
        author: `${user.firstName} ${user.lastName}`.trim(),
        text,
        createdAt: data.created_at,
      };
      setFeed((prev) => prev.map((p) =>
        p.id === serviceId
          ? { ...p, commentList: [...p.commentList, newComment], comments: p.comments + 1 }
          : p
      ));
    }
  };

  const toggleLike = (id: string) => {
    setFeed((prev) => prev.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p
    ));
    if (user) {
      apiToggleLike(user._id, id).catch(() => {
        setFeed((prev) => prev.map((p) =>
          p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p
        ));
      });
    }
  };

  const toggleSave = (id: string) => {
    setFeed((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
    if (user) {
      apiToggleFavorite({ userId: user._id, targetId: id, targetType: 'service' }).catch(() => {
        setFeed((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-fuchsia-500 border-t-transparent animate-spin" />
          <p className="text-white/60 text-sm">Chargement du GlamFeed...</p>
        </div>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-6 z-50">
        <Camera className="h-16 w-16 text-white/20" />
        <p className="text-white/50 text-sm text-center px-8">
          Aucun contenu disponible.<br />Les pros peuvent publier leurs photos depuis leur espace pro.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Feed plein ecran, scroll snap vertical */}
      <div
        className="-mx-4 -mt-4 sm:-mx-6 lg:-mx-8 overflow-y-scroll"
        style={{
          height: 'calc(100svh - 56px)',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {feed.map((item) => (
          <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
            <ReelCard
              item={item}
              onLike={toggleLike}
              onSave={toggleSave}
              onComment={handleOpenComment}
              user={user}
            />
          </div>
        ))}
      </div>

      {/* Bouton publier (clients) */}
      {user && (
        <button
          onClick={() => navigate('/glamfeed/publish')}
          className="fixed bottom-24 left-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-bold shadow-xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
        >
          <Plus className="h-4 w-4" />
          Publier
        </button>
      )}

      {/* Drawer commentaires */}
      {commentItem && (
        <CommentDrawer
          item={commentItem}
          onClose={() => setCommentItem(null)}
          onAddComment={handleAddComment}
          user={user}
        />
      )}
    </>
  );
}
