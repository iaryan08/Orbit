-- Add columns to track when the user last viewed the memories and letters pages
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_viewed_memories_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_viewed_letters_at TIMESTAMPTZ DEFAULT NOW();

-- Optional: Create a policy if needed, but profiles are generally updatable by the user
-- Ensure RLS allows users to update their own profile (usually already set up)
