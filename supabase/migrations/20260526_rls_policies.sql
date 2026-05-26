-- ============================================================================
-- Supabase RLS Policies — Alora
-- Apply via Supabase SQL Editor
-- Column names are camelCase (Prisma convention), always double-quoted
-- All IDs are TEXT (Prisma default), so auth.uid() (uuid) must be cast ::text
-- ============================================================================

-- 1. HELPER: Check if user is admin/moderator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND "role" IN ('admin', 'moderator')
  );
$$;

-- 2. HELPER: Check if user is participant in a match
CREATE OR REPLACE FUNCTION public.is_match_participant(match_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = match_id AND ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text)
  );
$$;

-- ============================================================================
-- ENABLE RLS ON ALL USER-FACING TABLES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_dating_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooldown_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closure_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS
-- ============================================================================
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid()::text OR public.is_admin());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid()::text);

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- SESSIONS (sensitive — contains token)
-- ============================================================================
CREATE POLICY "sessions_select_own" ON public.sessions
  FOR SELECT USING ("userId" = auth.uid()::text OR public.is_admin());

CREATE POLICY "sessions_delete_own" ON public.sessions
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- MATCHES
-- ============================================================================
CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT USING ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text OR public.is_admin());

CREATE POLICY "matches_insert" ON public.matches
  FOR INSERT WITH CHECK ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text);

CREATE POLICY "matches_update_participant" ON public.matches
  FOR UPDATE USING ("user1Id" = auth.uid()::text OR "user2Id" = auth.uid()::text);

-- ============================================================================
-- MESSAGES
-- ============================================================================
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (public.is_match_participant("matchId") OR public.is_admin());

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK ("senderId" = auth.uid()::text AND public.is_match_participant("matchId"));

CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING ("senderId" = auth.uid()::text);

-- ============================================================================
-- INTERACTIONS (likes/passes)
-- ============================================================================
CREATE POLICY "interactions_select_own" ON public.interactions
  FOR SELECT USING ("fromUserId" = auth.uid()::text OR "toUserId" = auth.uid()::text);

CREATE POLICY "interactions_insert_own" ON public.interactions
  FOR INSERT WITH CHECK ("fromUserId" = auth.uid()::text);

-- ============================================================================
-- COPILOT CONTEXT
-- ============================================================================
CREATE POLICY "copilot_context_select" ON public.copilot_context
  FOR SELECT USING (public.is_match_participant("matchId") OR public.is_admin());

-- ============================================================================
-- COPILOT EVENTS
-- ============================================================================
CREATE POLICY "copilot_events_select" ON public.copilot_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.copilot_context cc
      WHERE cc.id = "copilotContextId" AND (public.is_match_participant(cc."matchId") OR public.is_admin())
    )
  );

-- ============================================================================
-- AI COACH SESSIONS
-- ============================================================================
CREATE POLICY "ai_coach_sessions_select_own" ON public.ai_coach_sessions
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "ai_coach_sessions_insert_own" ON public.ai_coach_sessions
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- AI MESSAGES
-- ============================================================================
CREATE POLICY "ai_messages_select_own" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_coach_sessions acs
      WHERE acs.id = "sessionId" AND acs."userId" = auth.uid()::text
    )
  );

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
CREATE POLICY "relationship_context_select" ON public.relationship_context
  FOR SELECT USING ("partner1Id" = auth.uid()::text OR "partner2Id" = auth.uid()::text);

CREATE POLICY "relationship_context_insert" ON public.relationship_context
  FOR INSERT WITH CHECK ("partner1Id" = auth.uid()::text OR "partner2Id" = auth.uid()::text);

-- ============================================================================
-- COMMUNICATION NOTES
-- ============================================================================
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
CREATE POLICY "wellbeing_events_select_own" ON public.wellbeing_events
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "wellbeing_events_insert_own" ON public.wellbeing_events
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- POST-DATING EVENTS
-- ============================================================================
CREATE POLICY "post_dating_events_select_own" ON public.post_dating_events
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "post_dating_events_insert_own" ON public.post_dating_events
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- COOLDOWN STATE
-- ============================================================================
CREATE POLICY "cooldown_state_select_own" ON public.cooldown_state
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "cooldown_state_insert_own" ON public.cooldown_state
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "cooldown_state_update_own" ON public.cooldown_state
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- CLOSURE ARTIFACTS
-- ============================================================================
CREATE POLICY "closure_artifacts_select_own" ON public.closure_artifacts
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "closure_artifacts_insert_own" ON public.closure_artifacts
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- BLOCKS
-- ============================================================================
CREATE POLICY "blocks_select_own" ON public.blocks
  FOR SELECT USING ("blockerId" = auth.uid()::text OR "blockedId" = auth.uid()::text);

CREATE POLICY "blocks_insert_own" ON public.blocks
  FOR INSERT WITH CHECK ("blockerId" = auth.uid()::text);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- PUSH TOKENS (sensitive — token column)
-- ============================================================================
CREATE POLICY "push_tokens_select_own" ON public.push_tokens
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "push_tokens_insert_own" ON public.push_tokens
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "push_tokens_delete_own" ON public.push_tokens
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- DEVICE FINGERPRINTS
-- ============================================================================
CREATE POLICY "device_fingerprints_select_own" ON public.device_fingerprints
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "device_fingerprints_insert_own" ON public.device_fingerprints
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- VERIFICATION SUBMISSIONS
-- ============================================================================
CREATE POLICY "verification_submissions_select_own" ON public.verification_submissions
  FOR SELECT USING ("userId" = auth.uid()::text OR public.is_admin());

CREATE POLICY "verification_submissions_insert_own" ON public.verification_submissions
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- USER MEMORY (sensitive — encrypted but user-private)
-- ============================================================================
CREATE POLICY "user_memory_select_own" ON public.user_memory
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "user_memory_insert_own" ON public.user_memory
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "user_memory_update_own" ON public.user_memory
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- RELATIONSHIP SNAPSHOTS
-- ============================================================================
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
CREATE POLICY "date_reflections_select_own" ON public.date_reflections
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "date_reflections_insert_own" ON public.date_reflections
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- REPORTS
-- ============================================================================
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK ("reporterId" = auth.uid()::text);

CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT USING (public.is_admin());

CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- ADMIN-ONLY TABLES (service role only)
-- ============================================================================
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR ALL USING (public.is_admin());

CREATE POLICY "incidents_admin_only" ON public.incidents
  FOR ALL USING (public.is_admin());

CREATE POLICY "jobs_admin_only" ON public.jobs
  FOR ALL USING (public.is_admin());

CREATE POLICY "locks_admin_only" ON public.locks
  FOR ALL USING (public.is_admin());

CREATE POLICY "analytics_events_admin_only" ON public.analytics_events
  FOR ALL USING (public.is_admin());

CREATE POLICY "rate_limits_admin_only" ON public.rate_limits
  FOR ALL USING (public.is_admin());

CREATE POLICY "idempotency_keys_admin_only" ON public.idempotency_keys
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- _PRISMA_MIGRATIONS — block all direct API access
-- ============================================================================
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prisma_migrations_no_access" ON public._prisma_migrations
  FOR ALL USING (false);
