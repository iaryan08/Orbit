-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Update Profiles Table to include Gender
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- 2. Create/Update Cycle Profiles Table
CREATE TABLE IF NOT EXISTS public.cycle_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_period_start DATE,
    avg_cycle_length INTEGER DEFAULT 28,
    avg_period_length INTEGER DEFAULT 5,
    contraception TEXT,
    trying_to_conceive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if they don't exist
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS regularity TEXT CHECK (regularity IN ('yes', 'sometimes', 'rarely'));
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS typical_symptoms JSONB DEFAULT '[]';
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS tracking_goals JSONB DEFAULT '[]';
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS privacy_level TEXT CHECK (privacy_level IN ('full', 'summary', 'hidden')) DEFAULT 'summary';
ALTER TABLE public.cycle_profiles ADD COLUMN IF NOT EXISTS sharing_enabled BOOLEAN DEFAULT FALSE;

-- 3. Cycle Logs (for history)
CREATE TABLE IF NOT EXISTS public.cycle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    flow_level TEXT CHECK (flow_level IN ('spotting', 'light', 'medium', 'heavy')),
    symptoms JSONB DEFAULT '[]',
    moods JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

-- 4. Enable RLS
ALTER TABLE public.cycle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Users can view own cycle profile" ON public.cycle_profiles;
CREATE POLICY "Users can view own cycle profile" ON public.cycle_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cycle profile" ON public.cycle_profiles;
CREATE POLICY "Users can update own cycle profile" ON public.cycle_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cycle profile" ON public.cycle_profiles;
CREATE POLICY "Users can insert own cycle profile" ON public.cycle_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view shared cycle profile" ON public.cycle_profiles;
CREATE POLICY "Partners can view shared cycle profile" ON public.cycle_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT partner_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view own cycle logs" ON public.cycle_logs;
CREATE POLICY "Users can view own cycle logs" ON public.cycle_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cycle logs" ON public.cycle_logs;
CREATE POLICY "Users can manage own cycle logs" ON public.cycle_logs
    FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cycle_profiles_updated_at ON public.cycle_profiles;
CREATE TRIGGER update_cycle_profiles_updated_at
    BEFORE UPDATE ON public.cycle_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
