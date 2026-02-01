-- 1. Remove the unique constraint that prevents multiple moods per day
ALTER TABLE public.moods DROP CONSTRAINT IF EXISTS moods_user_id_mood_date_key;

-- 2. Create a function to delete moods that are not from today
CREATE OR REPLACE FUNCTION public.delete_old_moods()
RETURNS void AS $$
BEGIN
  DELETE FROM public.moods WHERE mood_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 3. To automate this daily at 00:00, you can use Supabase's pg_cron (if enabled)
-- In the Supabase SQL Editor, run:
-- SELECT cron.schedule('delete-moods-at-midnight', '0 0 * * *', 'SELECT public.delete_old_moods()');
