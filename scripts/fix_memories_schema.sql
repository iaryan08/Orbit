-- Fix memories table schema to satisfy frontend requirements (array of images)

-- 1. Add the new array column
ALTER TABLE public.memories 
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- 2. Add the missing location column
ALTER TABLE public.memories 
ADD COLUMN IF NOT EXISTS location text;

-- 3. Drop the old singular column
-- We drop it to match the code's expectation and avoid confusion
ALTER TABLE public.memories 
DROP COLUMN IF EXISTS image_url;
