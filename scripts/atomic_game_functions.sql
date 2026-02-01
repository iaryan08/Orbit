-- Function to atomically submit an answer for Would You Rather
CREATE OR REPLACE FUNCTION public.submit_wyr_answer(
  p_couple_id UUID,
  p_user_id UUID,
  p_choice TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_current_state JSONB;
  v_current_choices JSONB;
  v_partner_id UUID;
  v_partner_choice TEXT;
  v_new_revealed BOOLEAN;
  v_updated_state JSONB;
BEGIN
  -- 1. Lock the game session row for this couple to prevent race conditions
  SELECT id, state INTO v_session_id, v_current_state
  FROM public.game_sessions
  WHERE couple_id = p_couple_id AND game_type = 'would-you-rather'
  FOR UPDATE; -- Critical: This locks the row!

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Game session not found';
  END IF;

  -- 2. Get current choices or empty object
  v_current_choices := COALESCE(v_current_state->'choices', '{}'::jsonb);

  -- 3. Merge new choice. We use jsonb_set to update just this user's key
  -- Note: p_user_id is UUID, cast to text for JSON key
  v_current_choices := jsonb_set(
    v_current_choices, 
    ARRAY[lower(p_user_id::text)], 
    to_jsonb(p_choice)
  );

  -- 4. Check if partner has answered
  -- We need the partner's ID. We can derive it from checking keys in choices that are NOT the current user
  -- Or strictly, we just check if the number of keys is 2.
  -- Assuming 2 players max for now.
  
  -- Simple logic: If we have 2 distinct keys in choices, reveal is true.
  IF (SELECT count(*) FROM jsonb_object_keys(v_current_choices)) >= 2 THEN
    v_new_revealed := true;
  ELSE
    v_new_revealed := false;
  END IF;

  -- 5. Construct new state
  -- We preserve other state fields (currentIndex, initiatorId, etc) and only update choices and revealed
  v_updated_state := v_current_state || 
                     jsonb_build_object('choices', v_current_choices) || 
                     jsonb_build_object('revealed', v_new_revealed);

  -- 6. Update the table
  UPDATE public.game_sessions
  SET state = v_updated_state,
      updated_at = now()
  WHERE id = v_session_id;

  RETURN v_updated_state;
END;
$$;
