-- Enable Realtime for critical tables
-- This allows the frontend to subscribe to changes (INSERT, UPDATE, DELETE)

-- 1. Add tables to the supabase_realtime publication
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.moods;
alter publication supabase_realtime add table public.daily_posts;

alter publication supabase_realtime add table public.love_letters;
alter publication supabase_realtime add table public.cycle_logs;

-- To verify, you can run:
-- select * from pg_publication_tables where pubname = 'supabase_realtime';
