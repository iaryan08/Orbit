-- Add location_source column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'gps';

-- Update comment for clarity
COMMENT ON COLUMN profiles.location_source IS 'Source of location data: gps or ip';
