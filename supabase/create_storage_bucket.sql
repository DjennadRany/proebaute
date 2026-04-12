-- ============================================================
-- LocBeauté · Création du bucket Storage "service-media"
-- À exécuter UNE SEULE FOIS dans le SQL Editor Supabase
-- ============================================================

-- 1. Créer le bucket public pour les médias de services
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-media',
  'service-media',
  true,
  20971520,  -- 20 Mo max
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique : tout le monde peut lire
CREATE POLICY "service-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-media');

-- 3. Politique : les professionnels connectés peuvent uploader dans leur dossier
CREATE POLICY "service-media pro upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-media'
    AND auth.role() = 'authenticated'
  );

-- 4. Politique : le propriétaire peut supprimer ses fichiers
CREATE POLICY "service-media pro delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'service-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
