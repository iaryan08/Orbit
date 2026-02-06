-- Add 'one_time' to allowed unlock_type values for love_letters
ALTER TABLE public.love_letters
DROP CONSTRAINT IF EXISTS love_letters_unlock_type_check;

ALTER TABLE public.love_letters
ADD CONSTRAINT love_letters_unlock_type_check 
CHECK (unlock_type IN ('birthday', 'anniversary', 'custom', 'immediate', 'one_time'));
