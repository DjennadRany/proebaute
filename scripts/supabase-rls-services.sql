-- =============================================================================
-- ProBeauté — RLS pour public.services (CRUD réservé au pro propriétaire)
-- =============================================================================
-- À exécuter dans Supabase → SQL Editor après scripts/supabase-rls-users-professionals.sql
-- Si vous avez déjà des policies SELECT publiques pour le catalogue, gardez-les :
-- celles-ci ajoutent seulement insert/update/delete liés à votre fiche pro.
-- =============================================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "probeaute_services_insert_own" ON public.services;
CREATE POLICY "probeaute_services_insert_own"
  ON public.services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "probeaute_services_update_own" ON public.services;
CREATE POLICY "probeaute_services_update_own"
  ON public.services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "probeaute_services_delete_own" ON public.services;
CREATE POLICY "probeaute_services_delete_own"
  ON public.services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );
