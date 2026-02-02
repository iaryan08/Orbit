-- Add read_at column to love_letters
ALTER TABLE love_letters 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
