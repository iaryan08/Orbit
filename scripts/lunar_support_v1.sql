-- LUNARA INTERACTIVE SUPPORT UPDATES

-- 1. Create Support Logs table
CREATE TABLE IF NOT EXISTS public.support_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    action_text TEXT NOT NULL,
    category TEXT CHECK (category IN ('physical', 'emotional', 'logistical', 'surprise')) DEFAULT 'emotional',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.support_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Users can view support logs relating to them" ON public.support_logs;
CREATE POLICY "Users can view support logs relating to them" ON public.support_logs
    FOR SELECT USING (auth.uid() = tracker_id OR auth.uid() = supporter_id);

DROP POLICY IF EXISTS "Supporters can create logs" ON public.support_logs;
CREATE POLICY "Supporters can create logs" ON public.support_logs
    FOR INSERT WITH CHECK (auth.uid() = supporter_id);

-- 4. Update cycle_logs to allow partner viewing if cycle shared
DROP POLICY IF EXISTS "Partners can view shared cycle logs" ON public.cycle_logs;
CREATE POLICY "Partners can view shared cycle logs" ON public.cycle_logs
    FOR SELECT USING (
        user_id IN (
            SELECT partner_id FROM public.profiles WHERE id = auth.uid()
        )
    );
