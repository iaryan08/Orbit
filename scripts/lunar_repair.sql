-- REPAIR SCRIPT FOR CYCLE PROFILES
-- Run this if onboarding is looping!

-- 1. Ensure columns exist and have correct types
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS last_period_start DATE;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS avg_cycle_length INTEGER DEFAULT 28;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS avg_period_length INTEGER DEFAULT 5;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS contraception TEXT;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS trying_to_conceive BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS regularity TEXT;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS typical_symptoms JSONB DEFAULT '[]';
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS tracking_goals JSONB DEFAULT '[]';
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'summary';
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS sharing_enabled BOOLEAN DEFAULT FALSE;

-- 2. If 'id' exists but isn't the primary key we want, ensure user_id is unique
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cycle_profiles_pkey' 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public.cycle_profiles ADD PRIMARY KEY (user_id);
    END IF;
END $$;

-- 3. Add Partner Policy
DROP POLICY IF EXISTS "Partners can view shared cycle profile" ON public.cycle_profiles;
CREATE POLICY "Partners can view shared cycle profile" ON public.cycle_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT partner_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- 4. Reset onboarding status for the current user if needed (DEBUG ONLY)
-- UPDATE public.cycle_profiles SET onboarding_completed = false WHERE user_id = auth.uid();
