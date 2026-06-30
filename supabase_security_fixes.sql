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
-- is_admin() — verificar users.role en vez de profiles.trustStatus
-- FIX: La versión anterior verificaba profiles.trustStatus que es para trust/safety,
-- NO para roles de admin. El campo correcto es users.role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
      AND role IN ('admin', 'super_admin', 'moderator')
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
-- 7. RLS en tablas críticas (users, profiles, matches, messages,
--    interactions, blocks, reports, notifications, audit_logs)
-- ============================================================

-- 7a. users — solo service_role puede acceder (la app usa Prisma con service_role)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_users"
  ON public.users
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7b. profiles — usuarios pueden leer perfiles públicos, solo service_role puede escribir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "service_role_full_access_profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7c. matches — solo participantes pueden ver sus matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_select_own_matches"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "user1Id" OR auth.uid()::text = "user2Id");
CREATE POLICY "service_role_full_access_matches"
  ON public.matches
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7d. messages — solo participantes del match pueden ver mensajes
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_select_own_messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = "matchId"
        AND (auth.uid()::text = "user1Id" OR auth.uid()::text = "user2Id")
    )
  );
CREATE POLICY "service_role_full_access_messages"
  ON public.messages
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7e. interactions — solo el emisor puede ver sus interacciones
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sender_select_own_interactions"
  ON public.interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "fromUserId");
CREATE POLICY "service_role_full_access_interactions"
  ON public.interactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7f. blocks — solo el bloqueador puede ver sus bloques
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocker_select_own_blocks"
  ON public.blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "blockerId");
CREATE POLICY "service_role_full_access_blocks"
  ON public.blocks
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7g. reports — solo el reportador puede ver sus reportes + service_role
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporter_select_own_reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "reporterId");
CREATE POLICY "service_role_full_access_reports"
  ON public.reports
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7h. notifications — solo el propietario puede ver sus notificaciones
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_own_notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");
CREATE POLICY "service_role_full_access_notifications"
  ON public.notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7i. audit_logs — solo service_role (logs de admin)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_audit_logs"
  ON public.audit_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7j. push_tokens — solo service_role
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_push_tokens"
  ON public.push_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7k. device_fingerprints — solo service_role
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_device_fingerprints"
  ON public.device_fingerprints
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 8. Leaked Password Protection
-- ============================================================
-- Esto NO se puede hacer con SQL. Ve a:
-- Supabase Dashboard → Authentication → Password Settings
-- → Habilitar "Check against leaked passwords"
-- ============================================================
