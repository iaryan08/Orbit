-- Enable REPLICA IDENTITY FULL for the game_sessions table
-- This allows Realtime filters to work on non-primary key columns like couple_id during updates.
ALTER TABLE game_sessions REPLICA IDENTITY FULL;

-- Ensure the table is in the supabase_realtime publication (just in case)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
  END IF;
END $$;
