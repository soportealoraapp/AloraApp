-- ============================================================
-- RLS Policies for Alora
-- Ejecutar en Supabase SQL Editor
--
-- NOTA: Prisma mapea String → text en PostgreSQL.
-- auth.uid() retorna uuid. Se usa CAST (auth.uid()::text)
-- para comparar con columnas text.
--
-- ACTUALIZACIÓN: Se agregaron policies para tablas críticas
-- (users, profiles, matches, messages, interactions, blocks,
-- reports, notifications, audit_logs, push_tokens,
-- device_fingerprints)
-- ============================================================

-- ============================================================
-- CRITICAL TABLES (NUEVAS)
-- ============================================================

-- 0a. users — solo service_role
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');

-- 0b. profiles — lectura pública autenticada, service_role escribe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_all_profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "service_role_full_access_profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- 0c. matches — solo participantes
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_select_own_matches"
  ON public.matches FOR SELECT TO authenticated
  USING (auth.uid()::text = "user1Id" OR auth.uid()::text = "user2Id");
CREATE POLICY "service_role_full_access_matches"
  ON public.matches FOR ALL
  USING (auth.role() = 'service_role');

-- 0d. messages — solo participantes del match
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_select_own_messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = "matchId"
        AND (auth.uid()::text = "user1Id" OR auth.uid()::text = "user2Id")
    )
  );
CREATE POLICY "service_role_full_access_messages"
  ON public.messages FOR ALL
  USING (auth.role() = 'service_role');

-- 0e. interactions — solo el emisor
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sender_select_own_interactions"
  ON public.interactions FOR SELECT TO authenticated
  USING (auth.uid()::text = "fromUserId");
CREATE POLICY "service_role_full_access_interactions"
  ON public.interactions FOR ALL
  USING (auth.role() = 'service_role');

-- 0f. blocks — solo el bloqueador
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocker_select_own_blocks"
  ON public.blocks FOR SELECT TO authenticated
  USING (auth.uid()::text = "blockerId");
CREATE POLICY "service_role_full_access_blocks"
  ON public.blocks FOR ALL
  USING (auth.role() = 'service_role');

-- 0g. reports — solo el reportador + service_role
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporter_select_own_reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid()::text = "reporterId");
CREATE POLICY "service_role_full_access_reports"
  ON public.reports FOR ALL
  USING (auth.role() = 'service_role');

-- 0h. notifications — solo el propietario
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_own_notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid()::text = "userId");
CREATE POLICY "service_role_full_access_notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'service_role');

-- 0i. audit_logs — solo service_role
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_audit_logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- 0j. push_tokens — solo service_role
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_push_tokens"
  ON public.push_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- 0k. device_fingerprints — solo service_role
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_device_fingerprints"
  ON public.device_fingerprints FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- EXISTING TABLES
-- ============================================================

-- 1. favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_favorites" ON public.favorites
    FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "users_insert_own_favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_delete_own_favorites" ON public.favorites
    FOR DELETE USING (auth.uid()::text = "userId");

-- 2. daily_questions (read-only for all)
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_daily_questions" ON public.daily_questions
    FOR SELECT USING (true);

-- 3. notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_notification_prefs" ON public.notification_preferences
    FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "users_insert_own_notification_prefs" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_update_own_notification_prefs" ON public.notification_preferences
    FOR UPDATE USING (auth.uid()::text = "userId");

-- 4. daily_answers
ALTER TABLE public.daily_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_daily_answers" ON public.daily_answers
    FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "users_insert_own_daily_answers" ON public.daily_answers
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_update_own_daily_answers" ON public.daily_answers
    FOR UPDATE USING (auth.uid()::text = "userId");

-- 5. daily_picks
ALTER TABLE public.daily_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_daily_picks" ON public.daily_picks
    FOR SELECT USING (auth.uid()::text = "userId");

-- 6. match_feedback
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_match_feedback" ON public.match_feedback
    FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "users_insert_own_match_feedback" ON public.match_feedback
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_update_own_match_feedback" ON public.match_feedback
    FOR UPDATE USING (auth.uid()::text = "userId");

-- 7. success_stories
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_success_stories" ON public.success_stories
    FOR SELECT USING (true);

-- 8. referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_referrals" ON public.referrals
    FOR SELECT USING (auth.uid()::text = "referrerId" OR auth.uid()::text = "referredId");
CREATE POLICY "users_insert_own_referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid()::text = "referrerId");

-- 9. beta_codes (admin only — RLS already enabled, adding policy for service_role)
CREATE POLICY "service_role_manage_beta_codes" ON public.beta_codes
    FOR ALL USING (auth.role() = 'service_role');

-- 10. profile_visits
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_profile_visits" ON public.profile_visits
    FOR SELECT USING (auth.uid()::text = "visitedId");
CREATE POLICY "authenticated_insert_profile_visits" ON public.profile_visits
    FOR INSERT WITH CHECK (auth.uid()::text = "visitorId");

-- 11. quiz_results
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_quiz_results" ON public.quiz_results
    FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "users_insert_own_quiz_results" ON public.quiz_results
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_update_own_quiz_results" ON public.quiz_results
    FOR UPDATE USING (auth.uid()::text = "userId");

-- 12. stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_stories" ON public.stories
    FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "users_insert_own_stories" ON public.stories
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_update_own_stories" ON public.stories
    FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "users_delete_own_stories" ON public.stories
    FOR DELETE USING (auth.uid()::text = "userId");

-- 13. story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_insert_own_story_views" ON public.story_views
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_select_own_story_views" ON public.story_views
    FOR SELECT USING (auth.uid()::text = "userId");

-- 14. waitlist_entries
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_insert_waitlist_entries" ON public.waitlist_entries
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "users_select_own_waitlist_entries" ON public.waitlist_entries
    FOR SELECT USING (auth.uid()::text = "userId");
