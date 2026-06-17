-- ============================================================
-- ALORA — Supabase Security Fixes
-- Pegar completo en el SQL Editor de Supabase y ejecutar
-- ============================================================

-- ============================================================
-- 1. Fix notification_preferences: agregar columnas faltantes
-- ============================================================
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS "readReceipts" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifications" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 2. Enable RLS on experiments tables (3 tablas)
-- ============================================================
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;

-- Policies: solo admins pueden leer/modificar experiments
CREATE POLICY "Admins can manage experiments"
  ON public.experiments
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage experiment_variants"
  ON public.experiment_variants
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read their own assignments"
  ON public.experiment_assignments
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Admins can manage experiment_assignments"
  ON public.experiment_assignments
  FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 3. Fix profile_visits: reemplazar policy INSERT always true
-- ============================================================
DROP POLICY IF EXISTS "anyone_insert_profile_visits" ON public.profile_visits;

CREATE POLICY "Authenticated users can insert their own visits"
  ON public.profile_visits
  FOR INSERT
  WITH CHECK (auth.uid()::text = "visitorId");

-- ============================================================
-- 4. Fix waitlist_entries: reemplazar policy INSERT always true
-- ============================================================
DROP POLICY IF EXISTS "anyone_insert_waitlist_entries" ON public.waitlist_entries;

CREATE POLICY "Authenticated users can insert waitlist entries"
  ON public.waitlist_entries
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- ============================================================
-- 5. Fix SECURITY DEFINER functions → SECURITY INVOKER
-- ============================================================
-- is_admin() — cambiar a SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE "userId" = auth.uid()::text
      AND "trustStatus" = 'admin'
  );
$$;

-- is_match_participant() — cambiar a SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.is_match_participant(match_id text)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = match_id
      AND (auth.uid()::text = "user1Id" OR auth.uid()::text = "user2Id")
  );
$$;

-- Revocar EXECUTE del rol anon para ambas funciones
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_match_participant(text) FROM anon;

-- ============================================================
-- 6. Fix spotify_accounts: agregar policies RLS
-- ============================================================
CREATE POLICY "Users can read their own spotify account"
  ON public.spotify_accounts
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own spotify account"
  ON public.spotify_accounts
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own spotify account"
  ON public.spotify_accounts
  FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own spotify account"
  ON public.spotify_accounts
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- ============================================================
-- 7. Leaked Password Protection
-- ============================================================
-- Esto NO se puede hacer con SQL. Ve a:
-- Supabase Dashboard → Authentication → Password Settings
-- → Habilitar "Check against leaked passwords"
-- ============================================================
