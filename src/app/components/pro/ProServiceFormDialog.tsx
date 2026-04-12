import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiService } from '../../api/client';
import { supabase } from '../../api/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImagePlus, Link, Loader2, Trash2, Upload } from 'lucide-react';

export type ProServiceFormValues = {
  title: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  imageUrl: string;
};

const emptyValues: ProServiceFormValues = {
  title: '',
  description: '',
  category: '',
  price: '',
  duration: '',
  imageUrl: '',
};

function serviceToValues(s: ApiService): ProServiceFormValues {
  return {
    title: s.title,
    description: s.description,
    category: s.category,
    price: String(s.price),
    duration: String(s.duration),
    imageUrl: s.media?.[0] && !s.media[0].includes('via.placeholder.com') ? s.media[0] : '',
  };
}

type ProServiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  service: ApiService | null;
  professionalId?: string | null;
  onSubmit: (values: ProServiceFormValues) => Promise<void>;
};

// ── Media Upload Zone ──────────────────────────────────────────────────────────
function MediaUploadZone({
  professionalId,
  currentUrl,
  onUrlChange,
}: {
  professionalId?: string | null;
  currentUrl: string;
  onUrlChange: (url: string) => void;
}) {
  const [tab, setTab] = useState<'upload' | 'url'>(currentUrl ? 'url' : 'upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // sync preview when dialog re-opens
  useEffect(() => {
    setPreview(currentUrl);
    setTab(currentUrl ? 'url' : 'upload');
  }, [currentUrl]);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadError('');
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setUploadError('Seuls les fichiers image ou vidéo sont acceptés.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadError('Le fichier ne doit pas dépasser 20 Mo.');
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const folder = professionalId ?? 'public';
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from('service-media')
          .upload(fileName, file, { upsert: false, cacheControl: '3600' });

        if (error) {
          // bucket may not exist yet – fall back gracefully
          if (
            error.message?.includes('Bucket not found') ||
            error.message?.includes('not found')
          ) {
            setUploadError(
              'Bucket "service-media" introuvable. Créez-le dans Supabase → Storage avec accès public.',
            );
            return;
          }
          throw error;
        }

        const { data: urlData } = supabase.storage
          .from('service-media')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;
        setPreview(publicUrl);
        onUrlChange(publicUrl);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Erreur lors de l\'upload.');
      } finally {
        setUploading(false);
      }
    },
    [professionalId, onUrlChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const clearMedia = () => {
    setPreview('');
    onUrlChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Tab switch */}
      <div className="flex gap-1 text-xs rounded-lg border border-border p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            tab === 'upload'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="w-3 h-3" />
          Uploader
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            tab === 'url'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link className="w-3 h-3" />
          URL
        </button>
      </div>

      {tab === 'upload' ? (
        <>
          {/* Drop zone */}
          <div
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer min-h-[140px] ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Upload en cours…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Glissez une image ici
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ou <span className="text-primary underline underline-offset-2">parcourir</span> — JPG, PNG, WebP, MP4 · max 20 Mo
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="sr-only"
              onChange={handleFileChange}
              tabIndex={-1}
            />
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2">
              {uploadError}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Input
            type="url"
            value={currentUrl}
            onChange={(e) => { onUrlChange(e.target.value); setPreview(e.target.value); }}
            placeholder="https://images.pexels.com/…"
          />
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-muted">
          {preview.match(/\.(mp4|webm)$/i) ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img
              src={preview}
              alt="Aperçu"
              className="w-full h-full object-cover"
              onError={() => setPreview('')}
            />
          )}
          <button
            type="button"
            onClick={clearMedia}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Supprimer l'image"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────
export function ProServiceFormDialog({
  open,
  onOpenChange,
  mode,
  service,
  professionalId,
  onSubmit,
}: ProServiceFormDialogProps) {
  const [values, setValues] = useState<ProServiceFormValues>(emptyValues);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLocalError('');
    if (mode === 'edit' && service) {
      setValues(serviceToValues(service));
    } else {
      setValues(emptyValues);
    }
  }, [open, mode, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!values.title.trim()) {
      setLocalError('Le titre est obligatoire.');
      return;
    }
    const price = Number(values.price.replace(',', '.'));
    const duration = Number(values.duration);
    if (!Number.isFinite(price) || price < 0) {
      setLocalError('Prix invalide.');
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setLocalError('Durée invalide (minutes).');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = [
    'Coiffure',
    'Barbier',
    'Onglerie',
    'Esthétique',
    'Maquillage',
    'Massage',
    'Soin visage',
    'Épilation',
    'Autre',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Nouveau service' : 'Modifier le service'}</DialogTitle>
            <DialogDescription>
              Ces informations sont visibles sur votre fiche publique et dans les résultats de recherche.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {localError && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {localError}
              </p>
            )}

            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="pro-svc-title">Titre *</Label>
              <Input
                id="pro-svc-title"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                placeholder="Ex. Coupe femme brushing"
                required
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="pro-svc-category">Catégorie</Label>
              <select
                id="pro-svc-category"
                value={values.category}
                onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Prix / Durée */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pro-svc-price">Prix (€) *</Label>
                <Input
                  id="pro-svc-price"
                  type="text"
                  inputMode="decimal"
                  value={values.price}
                  onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pro-svc-duration">Durée (min) *</Label>
                <Input
                  id="pro-svc-duration"
                  type="text"
                  inputMode="numeric"
                  value={values.duration}
                  onChange={(e) => setValues((v) => ({ ...v, duration: e.target.value }))}
                  placeholder="60"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="pro-svc-desc">Description</Label>
              <Textarea
                id="pro-svc-desc"
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                placeholder="Détaillez la prestation, les produits, le déroulé…"
                rows={4}
                className="resize-y"
              />
            </div>

            {/* Media upload */}
            <div className="space-y-2">
              <Label>Photo / Vidéo du service</Label>
              <MediaUploadZone
                professionalId={professionalId}
                currentUrl={values.imageUrl}
                onUrlChange={(url) => setValues((v) => ({ ...v, imageUrl: url }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : mode === 'create' ? 'Créer le service' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
