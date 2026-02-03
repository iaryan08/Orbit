-- RLS Policy Optimizations (FIXED RECURSION)
-- Fixes: Infinite recursion in profiles/couples policies
-- Fixes: auth_rls_initplan (Wrap auth functions in SELECT)
-- Fixes: multiple_permissive_policies (Consolidate policies)

-- ==============================================================================
-- 1. COUPLES (Base Table - Must not depend on Profiles)
-- ==============================================================================
-- Drop ALL potential existing view policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own couple" ON public.couples;
DROP POLICY IF EXISTS "Users can find couple by code to join" ON public.couples;
DROP POLICY IF EXISTS "Users can view relevant couples" ON public.couples;
DROP POLICY IF EXISTS "Users can view own couple or join" ON public.couples;

-- Combined view policy (Own Couple OR Join by Code)
-- CRITICAL: This MUST NOT query public.profiles to avoid circular dependency
CREATE POLICY "Users can view relevant couples" ON public.couples
    FOR SELECT USING (
        auth.uid() = user1_id 
        OR 
        auth.uid() = user2_id
        OR 
        couple_code IS NOT NULL -- Allow finding any couple by code (needed for joining)
    );

DROP POLICY IF EXISTS "Users can create couple" ON public.couples;
CREATE POLICY "Users can create couple" ON public.couples
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can update own couple" ON public.couples;
CREATE POLICY "Users can update own couple" ON public.couples
    FOR UPDATE USING (
        auth.uid() = user1_id 
        OR 
        auth.uid() = user2_id
    );


-- ==============================================================================
-- 2. PROFILES (Can depend on Couples now)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;

-- Combined policy for viewing (Own + Partner)
CREATE POLICY "Users can view relevant profiles" ON public.profiles
    FOR SELECT USING (
        id = (select auth.uid()) -- Own profile
        OR 
        -- Partner profile (found via couples table)
        id IN (
            SELECT user1_id FROM public.couples WHERE user2_id = (select auth.uid())
            UNION
            SELECT user2_id FROM public.couples WHERE user1_id = (select auth.uid())
        )
    );

-- Separate write policies (usually strictly own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = (select auth.uid()));


-- ==============================================================================
-- 3. MOODS
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view couple moods" ON public.moods;
CREATE POLICY "Users can view couple moods" ON public.moods
    FOR SELECT USING (
        user_id = (select auth.uid())
        OR
        -- Check if user is my partner via couples table
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert own mood" ON public.moods;
CREATE POLICY "Users can insert own mood" ON public.moods
    FOR INSERT WITH CHECK (
        user_id = (select auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own mood" ON public.moods;
CREATE POLICY "Users can update own mood" ON public.moods
    FOR UPDATE USING (
        user_id = (select auth.uid())
    );


-- ==============================================================================
-- 4. LOVE LETTERS
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own letters" ON public.love_letters;
DROP POLICY IF EXISTS "Users can send letters" ON public.love_letters;
DROP POLICY IF EXISTS "Users can view/send letters" ON public.love_letters;

CREATE POLICY "Users can view/send letters" ON public.love_letters
    FOR ALL USING (
        sender_id = (select auth.uid()) 
        OR 
        receiver_id = (select auth.uid())
    );


-- ==============================================================================
-- 5. DARES
-- ==============================================================================
DROP POLICY IF EXISTS "Couple can view dares" ON public.dares;
DROP POLICY IF EXISTS "Users can create dares" ON public.dares;
DROP POLICY IF EXISTS "Users can update dares" ON public.dares;
DROP POLICY IF EXISTS "Couple can access dares" ON public.dares;

-- Consolidated "Couple Access"
CREATE POLICY "Couple can access dares" ON public.dares
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );


-- ==============================================================================
-- 6. DAILY POSTS
-- ==============================================================================
DROP POLICY IF EXISTS "Couple can view posts" ON public.daily_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.daily_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.daily_posts;

CREATE POLICY "Couple can view posts" ON public.daily_posts
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can manage own posts" ON public.daily_posts;
CREATE POLICY "Users can manage own posts" ON public.daily_posts
    FOR ALL USING (
        user_id = (select auth.uid())
    );


-- ==============================================================================
-- 7. GAME SESSIONS
-- ==============================================================================
DROP POLICY IF EXISTS "Couple can view games" ON public.game_sessions;
DROP POLICY IF EXISTS "Couple can create games" ON public.game_sessions;
DROP POLICY IF EXISTS "Couple can update games" ON public.game_sessions;
DROP POLICY IF EXISTS "Couple can manage games" ON public.game_sessions;

CREATE POLICY "Couple can manage games" ON public.game_sessions
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );


-- ==============================================================================
-- 8. MEMORIES
-- ==============================================================================
DROP POLICY IF EXISTS "Couple can view memories" ON public.memories;
DROP POLICY IF EXISTS "Users can add memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;

CREATE POLICY "Couple can view memories" ON public.memories
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can manage own memories" ON public.memories;
CREATE POLICY "Users can manage own memories" ON public.memories
    FOR ALL USING (
        user_id = (select auth.uid())     
    );


-- ==============================================================================
-- 9. MILESTONES
-- ==============================================================================
DROP POLICY IF EXISTS "Couple can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Couple can insert milestones" ON public.milestones;
DROP POLICY IF EXISTS "Couple can update milestones" ON public.milestones;
DROP POLICY IF EXISTS "Couple can manage milestones" ON public.milestones;

CREATE POLICY "Couple can manage milestones" ON public.milestones
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );


-- ==============================================================================
-- 10. CYCLE PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own cycle profile" ON public.cycle_profiles;
DROP POLICY IF EXISTS "Users can update own cycle profile" ON public.cycle_profiles;
DROP POLICY IF EXISTS "Users can insert own cycle profile" ON public.cycle_profiles;
DROP POLICY IF EXISTS "Partners can view shared cycle profile" ON public.cycle_profiles;
DROP POLICY IF EXISTS "Couple can view cycle profiles" ON public.cycle_profiles;
DROP POLICY IF EXISTS "Users can manage own cycle profile" ON public.cycle_profiles;

CREATE POLICY "Users can manage own cycle profile" ON public.cycle_profiles
    FOR ALL USING (
        user_id = (select auth.uid())
    );

DROP POLICY IF EXISTS "Partners can view cycle profile" ON public.cycle_profiles;
CREATE POLICY "Partners can view cycle profile" ON public.cycle_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT user1_id FROM public.couples WHERE user2_id = (select auth.uid())
            UNION
            SELECT user2_id FROM public.couples WHERE user1_id = (select auth.uid())
        )
    );


-- ==============================================================================
-- 11. CYCLE LOGS
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Users can manage own cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Couple can view cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Partners can view cycle logs" ON public.cycle_logs;

CREATE POLICY "Users can manage own cycle logs" ON public.cycle_logs
    FOR ALL USING (
        user_id = (select auth.uid())
    );

CREATE POLICY "Partners can view cycle logs" ON public.cycle_logs
    FOR SELECT USING (
        user_id IN (
            SELECT user1_id FROM public.couples WHERE user2_id = (select auth.uid())
            UNION
            SELECT user2_id FROM public.couples WHERE user1_id = (select auth.uid())
        )
    );


-- ==============================================================================
-- 12. SUPPORT LOGS
-- ==============================================================================
DROP POLICY IF EXISTS "Supporters can create logs" ON public.support_logs;
DROP POLICY IF EXISTS "Couple can view support logs" ON public.support_logs;

CREATE POLICY "Couple can view support logs" ON public.support_logs
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );

CREATE POLICY "Supporters can create logs" ON public.support_logs
    FOR INSERT WITH CHECK (
        supporter_id = (select auth.uid())
    );


-- ==============================================================================
-- 13. COUPLE INSIGHTS
-- ==============================================================================
DROP POLICY IF EXISTS "Couples can view their own insights" ON public.couple_insights;
DROP POLICY IF EXISTS "Users can insert insights for their couple" ON public.couple_insights;
DROP POLICY IF EXISTS "Enable read access for all users to global insights" ON public.couple_insights;
DROP POLICY IF EXISTS "Couples can view own insights" ON public.couple_insights;
DROP POLICY IF EXISTS "Users can manage couple insights" ON public.couple_insights;

CREATE POLICY "Couples can view own insights" ON public.couple_insights
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can manage couple insights" ON public.couple_insights
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM public.couples 
            WHERE user1_id = (select auth.uid()) OR user2_id = (select auth.uid())
        )
    );
    
-- Global insights
-- (Removed as 'type' column does not exist and couple_id is NOT NULL)
DROP POLICY IF EXISTS "View global insights" ON public.couple_insights;


-- ==============================================================================
-- 14. NOTIFICATIONS
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;

CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (
        recipient_id = (select auth.uid())
    );

DROP POLICY IF EXISTS "Any user can insert notification" ON public.notifications;
CREATE POLICY "Any user can insert notification" ON public.notifications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );
