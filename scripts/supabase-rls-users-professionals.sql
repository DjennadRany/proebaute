-- =============================================================================
-- ProBeauté — RLS pour public.users et public.professionals (upsert depuis l’app)
-- =============================================================================
-- Symptômes sans ces règles : 403 sur POST .../users?on_conflict=id et professionals.
-- Où l’exécuter : Supabase Dashboard → SQL Editor → coller → Run.
--
-- Sécurité / catalogue : si la création, la modification ou la suppression de services
-- échoue avec une erreur de permission (403), exécutez aussi dans le SQL Editor le
-- fichier scripts/supabase-rls-services.sql (en plus de ce script).
--
-- Si des politiques portent déjà le même nom, le DROP les remplace.
-- Si vous avez d’autres politiques SELECT sur professionals (catalogue public),
-- ne les supprimez pas : celles-ci s’ajoutent (Postgres combine les USING en OU).
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- ----- public.users : chaque compte Auth ne gère que sa ligne (id = auth.uid()) -----

DROP POLICY IF EXISTS "probeaute_users_select_own" ON public.users;
CREATE POLICY "probeaute_users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "probeaute_users_insert_own" ON public.users;
CREATE POLICY "probeaute_users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "probeaute_users_update_own" ON public.users;
CREATE POLICY "probeaute_users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----- public.professionals : insert/update de sa fiche (user_id = auth.uid()) -----
-- La lecture catalogue est souvent une policy séparée (anon / all) : à garder côté projet.

DROP POLICY IF EXISTS "probeaute_professionals_insert_own" ON public.professionals;
CREATE POLICY "probeaute_professionals_insert_own"
  ON public.professionals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "probeaute_professionals_update_own" ON public.professionals;
CREATE POLICY "probeaute_professionals_update_own"
  ON public.professionals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optionnel : le pro peut lire sa propre fiche si aucune autre policy SELECT ne couvre user_id.
DROP POLICY IF EXISTS "probeaute_professionals_select_own" ON public.professionals;
CREATE POLICY "probeaute_professionals_select_own"
  ON public.professionals FOR SELECT
  USING (auth.uid() = user_id);
