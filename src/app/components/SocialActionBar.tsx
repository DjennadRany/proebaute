import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';

interface SocialActionBarProps {
  isLiked?: boolean;
  isFavorited?: boolean;
  likesCount?: number | null;
  commentsCount?: number | null;
  onLike?: () => void;
  onComment?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
}

export function SocialActionBar({
  isLiked = false,
  isFavorited = false,
  likesCount = 0,
  commentsCount = 0,
  onLike,
  onComment,
  onFavorite,
  onShare,
}: SocialActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-y border-border sm:gap-6">
      <button
        onClick={onLike}
        className={`flex items-center gap-2 transition-colors ${
          isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
        }`}
      >
        <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
        <span className="text-sm font-medium">{likesCount}</span>
      </button>

      <button
        onClick={onComment}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{commentsCount}</span>
      </button>

      <button
        onClick={onFavorite}
        className={`flex items-center gap-2 transition-colors ${
          isFavorited ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <Bookmark className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} />
      </button>

      <button
        onClick={onShare}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-0 sm:ml-auto"
      >
        <Share2 className="w-5 h-5" />
      </button>
    </div>
  );
}
