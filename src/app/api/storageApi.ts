import { supabase } from './supabaseClient';

const BUCKET_AVATARS = 'avatars';
const BUCKET_GALLERY = 'gallery';

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit etre une image');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image trop lourde (max 5 Mo)');
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_AVATARS).upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error('Erreur upload avatar: ' + error.message);
  const { data } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadGalleryPhoto(proId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit etre une image');
  if (file.size > 10 * 1024 * 1024) throw new Error('Image trop lourde (max 10 Mo)');
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
  const path = proId + '/' + filename;
  const { error } = await supabase.storage.from(BUCKET_GALLERY).upload(path, file, { contentType: file.type });
  if (error) throw new Error('Erreur upload galerie: ' + error.message);
  const { data } = supabase.storage.from(BUCKET_GALLERY).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBanner(proId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit etre une image');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image trop lourde (max 8 Mo)');
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = proId + '/banner.' + ext;
  const { error } = await supabase.storage.from(BUCKET_GALLERY).upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error('Erreur upload banniere: ' + error.message);
  const { data } = supabase.storage.from(BUCKET_GALLERY).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteGalleryPhoto(photoUrl: string): Promise<void> {
  try {
    const url = new URL(photoUrl);
    const parts = url.pathname.split('/' + BUCKET_GALLERY + '/');
    if (parts.length < 2) return;
    const filePath = parts[1];
    await supabase.storage.from(BUCKET_GALLERY).remove([filePath]);
  } catch { /* ignore */ }
}

export async function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', quality);
    };
    img.src = url;
  });
}
