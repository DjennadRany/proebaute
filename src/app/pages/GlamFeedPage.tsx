import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Heart, MessageCircle, Bookmark, Share2, X, Send,
  Camera,
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

// ─── helpers ─────────────────────────────────────────────────────────────────

function getAccent(id: string): string {
  const p = ['#C9A84C', '#ec4899', '#f59e0b', '#0ea5e9', '#ef4444', '#10b981', '#F5D58B', '#f97316'];
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

// ─── types ───────────────────────────────────────────────────────────────────

type Comment = { id: string; author: string; text: string; createdAt: string };

type FeedItem = {
  id: string;
  service: ApiService | null;
  pro: ApiProfessional | undefined;
  image: string;
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: number;
  commentList: Comment[];
  commentsLoaded: boolean;
  isClientPost?: boolean;
  clientName?: string;
  caption?: string;
};

// ─── CommentDrawer ────────────────────────────────────────────────────────────

function CommentDrawer({
  item,
  onClose,
  onAddComment,
  user,
}: {
  item: FeedItem;
  onClose: () => void;
  onAddComment: (id: string, text: string) => Promise<void>;
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-3xl flex flex-col max-h-[70vh] shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <h3 className="font-semibold text-sm">{item.comments} commentaire{item.comments !== 1 ? 's' : ''}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {item.commentList.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Soyez le premier à commenter !</p>
          ) : (
            item.commentList.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B6914] to-[#C9A84C] flex items-center justify-center text-white text-xs font-bold shrink-0">
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
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B6914] to-[#C9A84C] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user ? (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase() : '?'}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={user ? 'Ajouter un commentaire...' : 'Connectez-vous pour commenter'}
            disabled={!user}
            className="flex-1 text-sm bg-muted rounded-full px-4 py-2 outline-none border border-border focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || sending || !user}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40"
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

// ─── ReelCard — performance optimisée via IntersectionObserver ────────────────

function ReelCard({
  item,
  index,
  onLike,
  onSave,
  onComment,
  user,
}: {
  item: FeedItem;
  index: number;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (item: FeedItem) => void;
  user: { _id: string; firstName: string; lastName: string } | null;
}) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mediaBroken, setMediaBroken] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  // Les 2 premières cartes chargent immédiatement, les autres attendent la visibilité
  const [shouldLoad, setShouldLoad] = useState(index < 2);
  const lastTap = useRef(0);

  // IntersectionObserver : charger l'image quand la carte est proche du viewport
  useEffect(() => {
    if (shouldLoad) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200% 0px' }, // précharge 2 cartes à l'avance
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const proName = item.pro?.professionalName ?? 'Pro LocBeauté';
  const proWords = proName.trim().split(/\s+/);
  const proInitials = (proWords[0]?.[0] ?? '') + (proWords[1]?.[0] ?? '');
  const proColor = item.pro ? getAccent(item.pro._id) : '#C9A84C';
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
      setTimeout(() => setLikeAnim(false), 700);
    }
    lastTap.current = now;
  }, [item.id, onLike]);

  const handleShare = () => {
    const url = item.service
      ? window.location.origin + '/services/' + item.service._id
      : window.location.origin + '/glamfeed';
    if (navigator.share) {
      navigator.share({ title: item.service?.title ?? 'LocBeauté', url });
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full bg-black select-none"
      style={{ height: '100%', minHeight: 500 }}
      onClick={handleTap}
    >
      {/* Skeleton pendant le chargement */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f16] to-[#07080c] animate-pulse" />
      )}

      {/* Media — ne charge que quand shouldLoad = true */}
      {shouldLoad && (
        isVid ? (
          <video
            src={mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay loop muted playsInline
            onError={() => setMediaBroken(true)}
            onLoadedData={() => setImgLoaded(true)}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={item.service?.title ?? 'Post beauté'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setMediaBroken(true); setImgLoaded(true); }}
            fetchPriority={index < 2 ? 'high' : 'low'}
          />
        )
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Animation coeur double-tap */}
      {likeAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Heart
            className="h-28 w-28 text-white fill-white drop-shadow-2xl"
            style={{ animation: 'heartPop 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards' }}
          />
        </div>
      )}

      {/* Pro info haut gauche */}
      <button
        className="absolute top-4 left-4 flex items-center gap-2.5 z-10"
        onClick={(e) => {
          e.stopPropagation();
          if (item.pro) navigate('/professionals/' + item.pro._id);
        }}
      >
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/80 shadow-lg shrink-0 ring-2 ring-black/20">
          {proPhoto ? (
            <img
              src={proPhoto}
              alt={proName}
              className="w-full h-full object-cover"
              onError={(ev) => {
                (ev.currentTarget.parentElement as HTMLElement).style.backgroundColor = proColor;
                ev.currentTarget.remove();
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: proColor }}
            >
              {proInitials.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="text-left drop-shadow-lg">
          <p className="text-white text-sm font-bold leading-tight">{proName}</p>
          {item.pro?.city && (
            <p className="text-white/70 text-[11px] leading-tight">{item.pro.city}</p>
          )}
        </div>
      </button>

      {/* Actions droite — style Instagram */}
      <div
        className="absolute right-3 bottom-32 flex flex-col items-center gap-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Like */}
        <button
          onClick={() => onLike(item.id)}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-75 ${
              item.liked ? 'scale-110' : 'group-active:scale-90'
            }`}
          >
            <Heart
              className={`h-7 w-7 drop-shadow-lg transition-all duration-200 ${
                item.liked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'
              }`}
            />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow text-center">
            {item.likes > 999 ? (item.likes / 1000).toFixed(1) + 'k' : item.likes}
          </span>
        </button>

        {/* Commentaire */}
        <button
          onClick={() => onComment(item)}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center active:scale-75 transition-transform duration-150">
            <MessageCircle className="h-7 w-7 text-white drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{item.comments}</span>
        </button>

        {/* Sauvegarder */}
        <button
          onClick={() => onSave(item.id)}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center active:scale-75 transition-transform duration-150">
            <Bookmark
              className={`h-7 w-7 drop-shadow-lg transition-all duration-200 ${
                item.saved ? 'fill-primary text-primary scale-110' : 'text-white'
              }`}
            />
          </div>
        </button>

        {/* Partage */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center active:scale-75 transition-transform duration-150">
            <Share2 className="h-7 w-7 text-white drop-shadow-lg" />
          </div>
        </button>
      </div>

      {/* Infos bas */}
      <div
        className="absolute bottom-6 left-4 right-16 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {item.isClientPost ? (
          <div>
            <span className="inline-block mb-2 px-3 py-0.5 rounded-full text-[11px] font-bold text-black shadow gold-bg">
              ✨ Post client
            </span>
            {item.caption && (
              <p className="text-white text-sm leading-snug line-clamp-3 drop-shadow">{item.caption}</p>
            )}
          </div>
        ) : item.service ? (
          <>
            <span
              className="inline-block mb-2 px-3 py-0.5 rounded-full text-[11px] font-bold text-white shadow"
              style={{ backgroundColor: proColor + 'dd' }}
            >
              {item.service.category}
            </span>
            <h3 className="text-white font-extrabold text-xl leading-tight drop-shadow-lg mb-1">
              {item.service.title}
            </h3>
            {item.service.description && (
              <p className="text-white/75 text-xs leading-snug mb-3 line-clamp-2">{item.service.description}</p>
            )}
            <div className="flex items-center gap-3">
              <div>
                <span className="text-white font-black text-2xl drop-shadow-lg">{item.service.price} €</span>
                {item.service.duration > 0 && (
                  <span className="text-white/55 text-xs ml-1">{item.service.duration}min</span>
                )}
              </div>
              <button
                onClick={() => navigate(
                  '/booking?serviceId=' + item.service!._id + (item.pro ? '&proId=' + item.pro._id : '')
                )}
                className="ml-auto px-5 py-2.5 rounded-full text-sm font-bold text-black shadow-xl active:scale-95 transition-all gold-bg"
              >
                Réserver
              </button>
            </div>
          </>
        ) : null}
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

    const fetchClientPosts = async () => {
      const { data } = await supabase
        .from('glamfeed_posts')
        .select('id, user_id, media_url, caption, likes_count, created_at, users:user_id(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    };

    Promise.all([
      fetchProfessionals(),
      fetchServices(),
      user ? fetchLikes(user._id) : Promise.resolve([]),
      user ? fetchFavorites(user._id) : Promise.resolve([]),
      fetchClientPosts(),
    ]).then(([proList, serviceList, likesList, favoritesList, clientPosts]) => {
      likesList.forEach((l) => { if (l.serviceId) likedIds.add(l.serviceId); });
      favoritesList.forEach((f) => savedIds.add(f.targetId));

      const proMap: Record<string, ApiProfessional> = {};
      proList.forEach((p) => { proMap[p._id] = p; });

      const serviceItems: FeedItem[] = serviceList
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
            isClientPost: false,
          };
        })
        .filter((x): x is FeedItem => x !== null);

      const clientItems: FeedItem[] = (clientPosts as any[]).map((p) => ({
        id: 'gp_' + p.id,
        service: null,
        pro: undefined,
        image: p.media_url,
        liked: false,
        saved: false,
        likes: p.likes_count ?? 0,
        comments: 0,
        commentList: [],
        commentsLoaded: false,
        isClientPost: true,
        clientName: p.users ? `${(p.users as any).first_name ?? ''} ${(p.users as any).last_name ?? ''}`.trim() : 'Client',
        caption: p.caption ?? '',
      }));

      const mixed: FeedItem[] = [];
      let ci = 0;
      serviceItems.forEach((item, i) => {
        mixed.push(item);
        if ((i + 1) % 4 === 0 && ci < clientItems.length) mixed.push(clientItems[ci++]);
      });
      while (ci < clientItems.length) mixed.push(clientItems[ci++]);

      setFeed(mixed);
    }).catch(() => setFeed([])).finally(() => setLoading(false));
  }, [user]);

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
    if (!item.commentsLoaded && !item.id.startsWith('gp_')) await loadComments(item.id);
    setCommentItem((prev) => (prev?.id === item.id ? null : feed.find((f) => f.id === item.id) ?? item));
  };

  useEffect(() => {
    if (commentItem) {
      const updated = feed.find((f) => f.id === commentItem.id);
      if (updated) setCommentItem(updated);
    }
  }, [feed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddComment = async (id: string, text: string) => {
    if (!user) return;
    if (id.startsWith('gp_')) {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: `${user.firstName} ${user.lastName}`.trim(),
        text,
        createdAt: new Date().toISOString(),
      };
      setFeed((prev) => prev.map((p) =>
        p.id === id ? { ...p, commentList: [...p.commentList, newComment], comments: p.comments + 1 } : p
      ));
      return;
    }
    const { data } = await supabase
      .from('reviews')
      .insert({ service_id: id, client_id: user._id, comment: text, rating: 5 })
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
        p.id === id ? { ...p, commentList: [...p.commentList, newComment], comments: p.comments + 1 } : p
      ));
      await supabase.rpc('increment_reviews_count', { p_service_id: id }).catch(() => {});
    }
  };

  const toggleLike = useCallback((id: string) => {
    // Optimistic update
    setFeed((prev) => prev.map((p) =>
      p.id === id
        ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 }
        : p
    ));
    if (user && !id.startsWith('gp_')) {
      apiToggleLike(user._id, id).catch(() => {
        // Rollback on error
        setFeed((prev) => prev.map((p) =>
          p.id === id
            ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 }
            : p
        ));
      });
    }
  }, [user]);

  const toggleSave = useCallback((id: string) => {
    setFeed((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
    if (user && !id.startsWith('gp_')) {
      apiToggleFavorite({ userId: user._id, targetId: id, targetType: 'service' }).catch(() => {
        setFeed((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-black"
        style={{ height: '100dvh' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-white/60 text-sm">Chargement du GlamFeed...</p>
        </div>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-black gap-6"
        style={{ height: '100dvh' }}
      >
        <Camera className="h-16 w-16 text-white/20" />
        <p className="text-white/50 text-sm text-center px-8">
          Aucun contenu disponible.<br />Les pros peuvent publier depuis leur espace pro.
        </p>
        <button
          onClick={() => navigate('/pro/services')}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-black gold-bg"
        >
          Publier du contenu
        </button>
      </div>
    );
  }

  // Hauteur = viewport - header (56px mobile / 64px sm+)
  // On utilise CSS custom property via style pour éviter le bug dvh/svh sur certains navigateurs
  return (
    <>
      {/* Animation coeur */}
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(0.5); opacity: 1; }
          50%  { transform: scale(1.4); opacity: 1; }
          80%  { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>

      {/* Container scroll-snap plein écran */}
      <div
        className="w-full overflow-y-scroll bg-black"
        style={{
          height: 'calc(100dvh - 56px)',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {feed.map((item, index) => (
          <div
            key={item.id}
            style={{
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              height: 'calc(100dvh - 56px)',
            }}
          >
            <ReelCard
              item={item}
              index={index}
              onLike={toggleLike}
              onSave={toggleSave}
              onComment={handleOpenComment}
              user={user}
            />
          </div>
        ))}
      </div>

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
