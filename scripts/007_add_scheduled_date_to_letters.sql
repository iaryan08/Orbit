-- Add scheduled_date column to love_letters
-- The app code uses scheduled_date instead of unlock_date

alter table public.love_letters 
add column if not exists scheduled_date timestamp with time zone;
