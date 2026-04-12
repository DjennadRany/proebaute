-- ============================================================
-- LocBeauté · Ajout colonne coordinates sur la table professionals
-- À exécuter UNE SEULE FOIS si la colonne n'existe pas encore
-- ============================================================

-- Ajoute la colonne coordinates (JSONB) si elle n'existe pas
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT NULL;

-- Index GIN pour les requêtes sur coordinates (optionnel mais recommandé)
CREATE INDEX IF NOT EXISTS idx_professionals_coordinates
  ON public.professionals USING GIN (coordinates);

-- Exemple de mise à jour manuelle pour un pro existant :
-- UPDATE public.professionals SET coordinates = '{"lat": 48.8566, "lng": 2.3522}' WHERE id = 'xxx';

-- Vérification
SELECT id, professional_name, city, coordinates
FROM public.professionals
LIMIT 10;
