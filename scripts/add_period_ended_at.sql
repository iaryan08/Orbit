-- Migration to add period_ended_at to cycle_profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycle_profiles' AND column_name = 'period_ended_at') THEN
        ALTER TABLE public.cycle_profiles ADD COLUMN period_ended_at DATE;
    END IF;
END $$;
