import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, ChevronLeft, Loader2, Sparkles, X } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { compressImage } from '../api/storageApi';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

// Bucket public "glamfeed" — créer dans Supabase Storage si besoin
const BUCKET = 'glamfeed';

async function uploadGlamFeedMedia(userId: string, file: File): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  if (!isVideo && !file.type.startsWith('image/')) {
    throw new Error('Format non supporté. Choisissez une image ou une vidéo.');
  }
  if (file.size > 50 * 1024 * 1024) throw new Error('Fichier trop lourd (max 50 Mo).');

  const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg');
  const filename = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  let uploadFile: File = file;
  if (!isVideo && file.size > 2 * 1024 * 1024) {
    uploadFile = await compressImage(file, 1080, 0.88);
  }

  const { error } = await supabase.storage.from(BUCKET).upload(filename, uploadFile, {
    contentType: uploadFile.type,
    upsert: false,
  });
  if (error) throw new Error('Erreur upload : ' + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export function GlamFeedPublishPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Sparkles className="h-12 w-12 text-primary" />
        <h2 className="text-lg font-semibold">Connectez-vous pour publier</h2>
        <Button onClick={() => navigate('/login')}>Se connecter</Button>
      </div>
    );
  }

  const handleFile = (f: File) => {
    setFile(f);
    setError('');
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Choisissez une photo ou vidéo.'); return; }
    setUploading(true);
    setError('');
    try {
      const mediaUrl = await uploadGlamFeedMedia(user._id, file);

      const { error: insertError } = await supabase.from('glamfeed_posts').insert({
        user_id: user._id,
        media_url: mediaUrl,
        caption: caption.trim() || null,
        likes_count: 0,
      });

      if (insertError) {
        // Si la table n'existe pas encore, afficher l'instruction SQL
        if (insertError.code === 'PGRST205' || insertError.message?.includes('does not exist')) {
          throw new Error(
            'La table glamfeed_posts n\'existe pas encore dans Supabase. ' +
            'Exécutez : CREATE TABLE glamfeed_posts (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, ' +
            'user_id uuid REFERENCES users(id), media_url text NOT NULL, caption text, ' +
            'likes_count integer DEFAULT 0, created_at timestamptz DEFAULT now());'
          );
        }
        throw new Error(insertError.message);
      }

      setSuccess(true);
      setTimeout(() => navigate('/glamfeed'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la publication.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Publication envoyée !</h2>
        <p className="text-muted-foreground text-sm">Votre post apparaîtra dans le GlamFeed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold flex-1">Nouveau post GlamFeed</h1>
        <Button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="rounded-full px-5 bg-primary hover:bg-primary/90 text-white"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publier'}
        </Button>
      </div>

      {/* Zone upload */}
      <div
        onClick={() => !preview && inputRef.current?.click()}
        className="relative w-full rounded-3xl overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
        style={{ aspectRatio: '9/16', maxHeight: '65vh' }}
      >
        {preview ? (
          file?.type.startsWith('video/') ? (
            <video src={preview} className="w-full h-full object-cover" controls autoPlay muted loop playsInline />
          ) : (
            <img src={preview} className="w-full h-full object-cover" alt="" />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
            <Camera className="h-12 w-12 opacity-50" />
            <p className="text-sm font-medium">Appuyez pour ajouter une photo ou vidéo</p>
            <p className="text-xs opacity-60">JPG, PNG, MP4, MOV — max 50 Mo</p>
          </div>
        )}

        {/* Bouton changer */}
        {preview && (
          <button
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Bouton supprimer */}
        {preview && (
          <button
            onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Overlay upload */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Publication en cours...</p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B6914] to-[#C9A84C] flex items-center justify-center text-white text-xs font-bold">
            {(user.firstName[0] + (user.lastName[0] ?? '')).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Décrivez votre look, votre coup de coeur... ✨"
          maxLength={300}
          rows={3}
          className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-primary resize-none"
        />
        <p className="text-xs text-right text-muted-foreground">{caption.length}/300</p>
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-accent dark:bg-accent border border-border dark:border-primary px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-primary dark:text-primary">Conseils ✨</p>
        <ul className="text-xs text-primary dark:text-primary space-y-0.5 list-disc pl-4">
          <li>Les photos verticales (9:16) s'affichent mieux</li>
          <li>Montrez le résultat avant/après pour plus d'engagement</li>
          <li>Taguez votre professionnel dans la légende</li>
        </ul>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
