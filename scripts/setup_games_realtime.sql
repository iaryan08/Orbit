-- 1. Create Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(couple_id, game_type)
);

-- 2. Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Couples can view their own game sessions"
ON game_sessions FOR SELECT
TO authenticated
USING (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Couples can create their own game sessions"
ON game_sessions FOR INSERT
TO authenticated
WITH CHECK (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Couples can update their own game sessions"
ON game_sessions FOR UPDATE
TO authenticated
USING (
  couple_id IN (
    SELECT couple_id FROM profiles WHERE id = auth.uid()
  )
);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
