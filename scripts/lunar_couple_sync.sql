-- MODERNIZE LUNARA SYNC TO USE COUPLE_ID
-- Consistent with Memories, Letters, and other features

-- 1. Add couple_id columns
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE;
ALTER TABLE public.cycle_logs ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE;
ALTER TABLE public.support_logs ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE;

-- 2. Update existing data if possible (optional but good practice)
UPDATE public.cycle_profiles cp
SET couple_id = p.couple_id
FROM public.profiles p
WHERE cp.user_id = p.id AND cp.couple_id IS NULL;

UPDATE public.cycle_logs cl
SET couple_id = p.couple_id
FROM public.profiles p
WHERE cl.user_id = p.id AND cl.couple_id IS NULL;

UPDATE public.support_logs sl
SET couple_id = p.couple_id
FROM public.profiles p
WHERE sl.tracker_id = p.id AND sl.couple_id IS NULL;

-- 3. Update RLS Policies for Couple-based access

-- Cycle Profiles
DROP POLICY IF EXISTS "Users can view own cycle profile" ON public.cycle_profiles;
DROP POLICY IF EXISTS "Partners can view shared cycle profile" ON public.cycle_profiles;
CREATE POLICY "Couple can view cycle profiles" ON public.cycle_profiles
    FOR SELECT USING (
        couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
    );

-- Cycle Logs
DROP POLICY IF EXISTS "Users can view own cycle logs" ON public.cycle_logs;
DROP POLICY IF EXISTS "Partners can view shared cycle logs" ON public.cycle_logs;
CREATE POLICY "Couple can view cycle logs" ON public.cycle_logs
    FOR SELECT USING (
        couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
    );

-- Support Logs
DROP POLICY IF EXISTS "Users can view support logs relating to them" ON public.support_logs;
CREATE POLICY "Couple can view support logs" ON public.support_logs
    FOR SELECT USING (
        couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
    );

-- 4. Enable Realtime for all three tables (ensure they are on the publication)
-- This is usually done in the Supabase Dashboard, but for completeness:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.cycle_profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.cycle_logs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.support_logs;
