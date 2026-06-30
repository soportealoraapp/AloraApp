-- ============================================================================
-- Supabase RLS Policies — Alora (Idempotent)
-- Safe to re-run: DROP POLICY IF EXISTS is used before every CREATE POLICY
-- ============================================================================

-- 1. HELPER FUNCTIONS (idempotent via CREATE OR REPLACE)
-- Helper functions live in private schema — not exposed via PostgREST /rest/v1/rpc/
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND "role" IN ('admin', 'super_admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_match_participant(match_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = match_id AND ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text)
  );
$$;

-- Grant USAGE so anon/authenticated can call these from RLS policy evaluation
GRANT USAGE ON SCHEMA private TO anon, authenticated;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES (idempotent — no-op if already enabled)
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ============================================================================
-- USERS
-- ============================================================================
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid()::text OR private.is_admin());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid()::text);

-- ============================================================================
-- PROFILES
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- SESSIONS
-- ============================================================================
DROP POLICY IF EXISTS "sessions_select_own" ON public.sessions;
CREATE POLICY "sessions_select_own" ON public.sessions
  FOR SELECT USING ("userId" = auth.uid()::text OR private.is_admin());

DROP POLICY IF EXISTS "sessions_delete_own" ON public.sessions;
CREATE POLICY "sessions_delete_own" ON public.sessions
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- MATCHES
-- ============================================================================
DROP POLICY IF EXISTS "matches_select_participant" ON public.matches;
CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT USING ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text OR private.is_admin());

DROP POLICY IF EXISTS "matches_insert" ON public.matches;
CREATE POLICY "matches_insert" ON public.matches
  FOR INSERT WITH CHECK ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text);

DROP POLICY IF EXISTS "matches_update_participant" ON public.matches;
CREATE POLICY "matches_update_participant" ON public.matches
  FOR UPDATE USING ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text);

-- ============================================================================
-- MESSAGES
-- ============================================================================
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (private.is_match_participant("matchId") OR private.is_admin());

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK ("senderId" = auth.uid()::text AND private.is_match_participant("matchId"));

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING ("senderId" = auth.uid()::text);

-- ============================================================================
-- INTERACTIONS
-- ============================================================================
DROP POLICY IF EXISTS "interactions_select_own" ON public.interactions;
CREATE POLICY "interactions_select_own" ON public.interactions
  FOR SELECT USING ("fromUserId" = auth.uid()::text OR "toUserId" = auth.uid()::text);

DROP POLICY IF EXISTS "interactions_insert_own" ON public.interactions;
CREATE POLICY "interactions_insert_own" ON public.interactions
  FOR INSERT WITH CHECK ("fromUserId" = auth.uid()::text);

-- ============================================================================
-- COPILOT CONTEXT
-- ============================================================================
DROP POLICY IF EXISTS "copilot_context_select" ON public.copilot_context;
CREATE POLICY "copilot_context_select" ON public.copilot_context
  FOR SELECT USING (private.is_match_participant("matchId") OR private.is_admin());

-- ============================================================================
-- COPILOT EVENTS
-- ============================================================================
DROP POLICY IF EXISTS "copilot_events_select" ON public.copilot_events;
CREATE POLICY "copilot_events_select" ON public.copilot_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.copilot_context cc
      WHERE cc.id = "copilotContextId" AND (private.is_match_participant(cc."matchId") OR private.is_admin())
    )
  );

-- ============================================================================
-- AI COACH SESSIONS
-- ============================================================================
DROP POLICY IF EXISTS "ai_coach_sessions_select_own" ON public.ai_coach_sessions;
CREATE POLICY "ai_coach_sessions_select_own" ON public.ai_coach_sessions
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "ai_coach_sessions_insert_own" ON public.ai_coach_sessions;
CREATE POLICY "ai_coach_sessions_insert_own" ON public.ai_coach_sessions
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- AI MESSAGES
-- ============================================================================
DROP POLICY IF EXISTS "ai_messages_select_own" ON public.ai_messages;
CREATE POLICY "ai_messages_select_own" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_coach_sessions acs
      WHERE acs.id = "sessionId" AND acs."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "ai_messages_insert_own" ON public.ai_messages;
CREATE POLICY "ai_messages_insert_own" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_coach_sessions acs
      WHERE acs.id = "sessionId" AND acs."userId" = auth.uid()::text
    )
  );

-- ============================================================================
-- RELATIONSHIP CONTEXT
-- ============================================================================
DROP POLICY IF EXISTS "relationship_context_select" ON public.relationship_context;
CREATE POLICY "relationship_context_select" ON public.relationship_context
  FOR SELECT USING ("partner1Id" = auth.uid()::text OR "partner2Id" = auth.uid()::text);

DROP POLICY IF EXISTS "relationship_context_insert" ON public.relationship_context;
CREATE POLICY "relationship_context_insert" ON public.relationship_context
  FOR INSERT WITH CHECK ("partner1Id" = auth.uid()::text OR "partner2Id" = auth.uid()::text);

-- ============================================================================
-- COMMUNICATION NOTES
-- ============================================================================
DROP POLICY IF EXISTS "communication_notes_select" ON public.communication_notes;
CREATE POLICY "communication_notes_select" ON public.communication_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.relationship_context rc
      WHERE rc.id = "relationshipId" AND (rc."partner1Id" = auth.uid()::text OR rc."partner2Id" = auth.uid()::text)
    )
  );

-- ============================================================================
-- CONFLICT REFLECTIONS
-- ============================================================================
DROP POLICY IF EXISTS "conflict_reflections_select" ON public.conflict_reflections;
CREATE POLICY "conflict_reflections_select" ON public.conflict_reflections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.relationship_context rc
      WHERE rc.id = "relationshipId" AND (rc."partner1Id" = auth.uid()::text OR rc."partner2Id" = auth.uid()::text)
    )
  );

-- ============================================================================
-- WELLBEING EVENTS
-- ============================================================================
DROP POLICY IF EXISTS "wellbeing_events_select_own" ON public.wellbeing_events;
CREATE POLICY "wellbeing_events_select_own" ON public.wellbeing_events
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "wellbeing_events_insert_own" ON public.wellbeing_events;
CREATE POLICY "wellbeing_events_insert_own" ON public.wellbeing_events
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- POST-DATING EVENTS
-- ============================================================================
DROP POLICY IF EXISTS "post_dating_events_select_own" ON public.post_dating_events;
CREATE POLICY "post_dating_events_select_own" ON public.post_dating_events
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "post_dating_events_insert_own" ON public.post_dating_events;
CREATE POLICY "post_dating_events_insert_own" ON public.post_dating_events
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- COOLDOWN STATE
-- ============================================================================
DROP POLICY IF EXISTS "cooldown_state_select_own" ON public.cooldown_state;
CREATE POLICY "cooldown_state_select_own" ON public.cooldown_state
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "cooldown_state_insert_own" ON public.cooldown_state;
CREATE POLICY "cooldown_state_insert_own" ON public.cooldown_state
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "cooldown_state_update_own" ON public.cooldown_state;
CREATE POLICY "cooldown_state_update_own" ON public.cooldown_state
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- CLOSURE ARTIFACTS
-- ============================================================================
DROP POLICY IF EXISTS "closure_artifacts_select_own" ON public.closure_artifacts;
CREATE POLICY "closure_artifacts_select_own" ON public.closure_artifacts
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "closure_artifacts_insert_own" ON public.closure_artifacts;
CREATE POLICY "closure_artifacts_insert_own" ON public.closure_artifacts
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- BLOCKS
-- ============================================================================
DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
CREATE POLICY "blocks_select_own" ON public.blocks
  FOR SELECT USING ("blockerId" = auth.uid()::text OR "blockedId" = auth.uid()::text);

DROP POLICY IF EXISTS "blocks_insert_own" ON public.blocks;
CREATE POLICY "blocks_insert_own" ON public.blocks
  FOR INSERT WITH CHECK ("blockerId" = auth.uid()::text);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- PUSH TOKENS (sensitive — token column)
-- ============================================================================
DROP POLICY IF EXISTS "push_tokens_select_own" ON public.push_tokens;
CREATE POLICY "push_tokens_select_own" ON public.push_tokens
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "push_tokens_insert_own" ON public.push_tokens;
CREATE POLICY "push_tokens_insert_own" ON public.push_tokens
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "push_tokens_delete_own" ON public.push_tokens;
CREATE POLICY "push_tokens_delete_own" ON public.push_tokens
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- DEVICE FINGERPRINTS
-- ============================================================================
DROP POLICY IF EXISTS "device_fingerprints_select_own" ON public.device_fingerprints;
CREATE POLICY "device_fingerprints_select_own" ON public.device_fingerprints
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "device_fingerprints_insert_own" ON public.device_fingerprints;
CREATE POLICY "device_fingerprints_insert_own" ON public.device_fingerprints
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- VERIFICATION SUBMISSIONS
-- ============================================================================
DROP POLICY IF EXISTS "verification_submissions_select_own" ON public.verification_submissions;
CREATE POLICY "verification_submissions_select_own" ON public.verification_submissions
  FOR SELECT USING ("userId" = auth.uid()::text OR private.is_admin());

DROP POLICY IF EXISTS "verification_submissions_insert_own" ON public.verification_submissions;
CREATE POLICY "verification_submissions_insert_own" ON public.verification_submissions
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- USER MEMORY
-- ============================================================================
DROP POLICY IF EXISTS "user_memory_select_own" ON public.user_memory;
CREATE POLICY "user_memory_select_own" ON public.user_memory
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "user_memory_insert_own" ON public.user_memory;
CREATE POLICY "user_memory_insert_own" ON public.user_memory
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "user_memory_update_own" ON public.user_memory;
CREATE POLICY "user_memory_update_own" ON public.user_memory
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- RELATIONSHIP SNAPSHOTS
-- ============================================================================
DROP POLICY IF EXISTS "relationship_snapshots_select" ON public.relationship_snapshots;
CREATE POLICY "relationship_snapshots_select" ON public.relationship_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = "matchId" AND (m."user1Id" = auth.uid()::text OR m."user2Id" = auth.uid()::text)
    )
  );

-- ============================================================================
-- DATE REFLECTIONS
-- ============================================================================
DROP POLICY IF EXISTS "date_reflections_select_own" ON public.date_reflections;
CREATE POLICY "date_reflections_select_own" ON public.date_reflections
  FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "date_reflections_insert_own" ON public.date_reflections;
CREATE POLICY "date_reflections_insert_own" ON public.date_reflections
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- REPORTS
-- ============================================================================
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK ("reporterId" = auth.uid()::text);

DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT USING (private.is_admin());

DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (private.is_admin());

-- ============================================================================
-- ADMIN-ONLY TABLES
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR ALL USING (private.is_admin());

DROP POLICY IF EXISTS "incidents_admin_only" ON public.incidents;
CREATE POLICY "incidents_admin_only" ON public.incidents
  FOR ALL USING (private.is_admin());

DROP POLICY IF EXISTS "jobs_admin_only" ON public.jobs;
CREATE POLICY "jobs_admin_only" ON public.jobs
  FOR ALL USING (private.is_admin());

DROP POLICY IF EXISTS "locks_admin_only" ON public.locks;
CREATE POLICY "locks_admin_only" ON public.locks
  FOR ALL USING (private.is_admin());

DROP POLICY IF EXISTS "analytics_events_admin_only" ON public.analytics_events;
CREATE POLICY "analytics_events_admin_only" ON public.analytics_events
  FOR ALL USING (private.is_admin());

DROP POLICY IF EXISTS "rate_limits_admin_only" ON public.rate_limits;
CREATE POLICY "rate_limits_admin_only" ON public.rate_limits
  FOR ALL USING (private.is_admin());

DROP POLICY IF EXISTS "idempotency_keys_admin_only" ON public.idempotency_keys;
CREATE POLICY "idempotency_keys_admin_only" ON public.idempotency_keys
  FOR ALL USING (private.is_admin());

-- ============================================================================
-- _PRISMA_MIGRATIONS — block all direct API access
-- ============================================================================
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prisma_migrations_no_access" ON public._prisma_migrations;
CREATE POLICY "prisma_migrations_no_access" ON public._prisma_migrations
  FOR ALL USING (false);
