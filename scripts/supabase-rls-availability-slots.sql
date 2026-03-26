-- =============================================================================
-- ProBeauté — Table + RLS pour public.availability_slots (plages récurrentes pro)
-- =============================================================================
-- day_of_week : 0 = lundi … 6 = dimanche (aligné sur l’app React).
-- À exécuter dans Supabase → SQL Editor après la table public.professionals.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT availability_slots_valid_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_slots_pro_id ON public.availability_slots (pro_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day_of_week ON public.availability_slots (day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_slots_pro_day_active
  ON public.availability_slots (pro_id, day_of_week)
  WHERE is_active = true;

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- Lecture publique : génération des créneaux côté client (y compris non connecté)
DROP POLICY IF EXISTS "probeaute_availability_slots_select_public" ON public.availability_slots;
CREATE POLICY "probeaute_availability_slots_select_public"
  ON public.availability_slots FOR SELECT
  USING (true);

-- CRUD réservé au professionnel propriétaire (pro_id → professionals.user_id)
DROP POLICY IF EXISTS "probeaute_availability_slots_insert_own" ON public.availability_slots;
CREATE POLICY "probeaute_availability_slots_insert_own"
  ON public.availability_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "probeaute_availability_slots_update_own" ON public.availability_slots;
CREATE POLICY "probeaute_availability_slots_update_own"
  ON public.availability_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "probeaute_availability_slots_delete_own" ON public.availability_slots;
CREATE POLICY "probeaute_availability_slots_delete_own"
  ON public.availability_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = pro_id AND p.user_id = auth.uid()
    )
  );
