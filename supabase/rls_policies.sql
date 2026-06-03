-- ============================================================
-- RLS Policies for Alora
-- Ejecutar en Supabase SQL Editor
--
-- NOTA: Prisma mapea String → text en PostgreSQL.
-- auth.uid() retorna uuid. Se usa CAST (auth.uid()::text)
-- para comparar con columnas text.
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
CREATE POLICY "anyone_insert_profile_visits" ON public.profile_visits
    FOR INSERT WITH CHECK (true);

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
CREATE POLICY "anyone_insert_waitlist_entries" ON public.waitlist_entries
    FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_own_waitlist_entries" ON public.waitlist_entries
    FOR SELECT USING (auth.uid()::text = "userId");
