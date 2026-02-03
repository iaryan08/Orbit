-- Security Fixes for Database Functions
-- Fixes "Function Search Path Mutable" warnings

-- 1. Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. Fix delete_old_moods
ALTER FUNCTION public.delete_old_moods() SET search_path = public;

-- 3. Fix submit_wyr_answer
-- This one is SECURITY DEFINER, so it is critical to set search_path
ALTER FUNCTION public.submit_wyr_answer(UUID, UUID, TEXT) SET search_path = public;
