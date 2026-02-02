-- Lunara (Period Tracker) Database Schema

-- 1. Cycle Profiles (User-specific settings and primary data)
CREATE TABLE IF NOT EXISTS public.cycle_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_period_start DATE,
    avg_cycle_length INTEGER DEFAULT 28,
    avg_period_length INTEGER DEFAULT 5,
    contraception TEXT,
    trying_to_conceive BOOLEAN DEFAULT FALSE,
    regularity TEXT CHECK (regularity IN ('yes', 'sometimes', 'rarely')),
    typical_symptoms JSONB DEFAULT '[]',
    tracking_goals JSONB DEFAULT '[]',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    privacy_level TEXT CHECK (privacy_level IN ('full', 'summary', 'hidden')) DEFAULT 'summary',
    sharing_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cycle Logs (Daily logging of periods, symptoms, and moods)
CREATE TABLE IF NOT EXISTS public.cycle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    log_type TEXT CHECK (log_type IN ('period_start', 'period_end', 'symptoms', 'mood')),
    symptoms JSONB DEFAULT '[]',
    mood_logs JSONB DEFAULT '[]',
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 3),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, log_type)
);

-- 3. Cycle Predictions (Persisted calculations to avoid expensive client-side compute)
CREATE TABLE IF NOT EXISTS public.cycle_predictions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    next_period_date DATE,
    ovulation_date DATE,
    fertile_window_start DATE,
    fertile_window_end DATE,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Partner Permissions (Granular control over what the partner can see)
CREATE TABLE IF NOT EXISTS public.lunara_partner_permissions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    can_see_fertile_window BOOLEAN DEFAULT FALSE,
    can_see_period_days BOOLEAN DEFAULT TRUE,
    can_see_mood_hints BOOLEAN DEFAULT TRUE,
    can_see_reminders BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.cycle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunara_partner_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for cycle_profiles
CREATE POLICY "Users can manage own cycle profile" ON public.cycle_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view shared cycle profile" ON public.cycle_profiles
    FOR SELECT USING (
        sharing_enabled = true AND 
        user_id IN (
            SELECT partner_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Policies for cycle_logs
CREATE POLICY "Users can manage own cycle logs" ON public.cycle_logs
    FOR ALL USING (auth.uid() = user_id);

-- Policies for cycle_predictions
CREATE POLICY "Users can view own cycle predictions" ON public.cycle_predictions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view shared cycle predictions" ON public.cycle_predictions
    FOR SELECT USING (
        user_id IN (
            SELECT partner_id FROM public.profiles WHERE id = auth.uid()
        ) AND (
            SELECT sharing_enabled FROM public.cycle_profiles WHERE user_id = cycle_predictions.user_id
        ) = true
    );

-- Policies for partner_permissions
CREATE POLICY "Users can manage own partner permissions" ON public.lunara_partner_permissions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view their permissions" ON public.lunara_partner_permissions
    FOR SELECT USING (
        user_id IN (
            SELECT partner_id FROM public.profiles WHERE id = auth.uid()
        )
    );
