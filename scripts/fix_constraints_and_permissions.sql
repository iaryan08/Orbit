-- 1. Update checkout constraint for game_sessions to support hyphenated names
ALTER TABLE public.game_sessions 
DROP CONSTRAINT IF EXISTS game_sessions_game_type_check;

ALTER TABLE public.game_sessions 
ADD CONSTRAINT game_sessions_game_type_check 
CHECK (game_type IN ('truth_dare', 'would_you_rather', 'truth-or-dare', 'would-you-rather', 'love-quiz', 'compliment_challenge', 'this_or_that', 'love_language_quiz', 'predict_partner'));

-- 2. Grant execution permissions on the RPC function
GRANT EXECUTE ON FUNCTION public.submit_wyr_answer(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_wyr_answer(UUID, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_wyr_answer(UUID, UUID, TEXT) TO service_role;

-- 3. Ensure the function is visible to PostgREST
NOTIFY pgrst, 'reload schema';
