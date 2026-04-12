import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { compressImage, uploadAvatar, uploadGalleryPhoto } from '../api/storageApi';

interface SupabaseImageUploadProps {
  entityId: string;
  mode: 'avatar' | 'gallery';
  currentUrl?: string;
  onUploaded: (url: string) => void;
  className?: string;
}

export function SupabaseImageUpload({ entityId, mode, currentUrl, onUploaded, className }: SupabaseImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentUrl ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const compressed = await compressImage(file, mode === 'avatar' ? 400 : 1200);
      const url = mode === 'avatar' ? await uploadAvatar(entityId, compressed) : await uploadGalleryPhoto(entityId, compressed);
      setPreview(url);
      onUploaded(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
      setPreview(currentUrl ?? '');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="relative group rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden"
        style={{ width: mode === 'avatar' ? 80 : '100%', height: mode === 'avatar' ? 80 : 160 }}>
        {preview ? (
          <img src={preview} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground p-2">
            <Upload className="h-5 w-5" />
            <span className="text-xs">{mode === 'avatar' ? 'Photo' : 'Ajouter'}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        {!uploading && preview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
