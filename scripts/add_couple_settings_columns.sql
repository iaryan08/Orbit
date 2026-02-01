-- Add couple_name and anniversary_date to couples table
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS couple_name text,
ADD COLUMN IF NOT EXISTS anniversary_date date;
