import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

// Use the non-pooling URL for DDL
const connectionString = process.env.POSTGRES_URL_NON_POOLING;

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runFix() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Fix constraints
        console.log('Updating game_sessions constraints...');
        await client.query(`
      ALTER TABLE public.game_sessions 
      DROP CONSTRAINT IF EXISTS game_sessions_game_type_check;

      ALTER TABLE public.game_sessions 
      ADD CONSTRAINT game_sessions_game_type_check 
      CHECK (game_type IN ('truth_dare', 'would_you_rather', 'truth-or-dare', 'would-you-rather', 'love-quiz', 'compliment_challenge', 'this_or_that', 'love_language_quiz', 'predict_partner'));
    `);

        // 2. Create the RPC function
        console.log('Creating submit_wyr_answer RPC...');
        await client.query(`
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
        v_new_revealed BOOLEAN;
        v_updated_state JSONB;
      BEGIN
        -- 1. Lock the game session row
        SELECT id, state INTO v_session_id, v_current_state
        FROM public.game_sessions
        WHERE couple_id = p_couple_id AND game_type = 'would-you-rather'
        FOR UPDATE;

        IF v_session_id IS NULL THEN
          -- Try underscored version as fallback if legacy data exists
          SELECT id, state INTO v_session_id, v_current_state
          FROM public.game_sessions
          WHERE couple_id = p_couple_id AND game_type = 'would_you_rather'
          FOR UPDATE;
        END IF;

        IF v_session_id IS NULL THEN
          RAISE EXCEPTION 'Game session not found for couple %', p_couple_id;
        END IF;

        -- 2. Get current choices
        v_current_choices := COALESCE(v_current_state->'choices', '{}'::jsonb);

        -- 3. Merge new choice
        v_current_choices := jsonb_set(
          v_current_choices, 
          ARRAY[lower(p_user_id::text)], 
          to_jsonb(p_choice)
        );

        -- 4. Check if both have answered
        IF (SELECT count(*) FROM jsonb_object_keys(v_current_choices)) >= 2 THEN
          v_new_revealed := true;
        ELSE
          v_new_revealed := false;
        END IF;

        -- 5. Construct new state
        v_updated_state := v_current_state || 
                           jsonb_build_object('choices', v_current_choices) || 
                           jsonb_build_object('revealed', v_new_revealed);

        -- 6. Update
        UPDATE public.game_sessions
        SET state = v_updated_state,
            updated_at = now()
        WHERE id = v_session_id;

        RETURN v_updated_state;
      END;
      $$;
    `);

        // 3. Grant Permissions
        console.log('Granting permissions...');
        await client.query(`
      GRANT EXECUTE ON FUNCTION public.submit_wyr_answer(UUID, UUID, TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.submit_wyr_answer(UUID, UUID, TEXT) TO anon;
    `);

        // 4. Migrate existing data to hyphens
        console.log('Migrating existing data to hyphens...');
        await client.query(`
      UPDATE public.game_sessions SET game_type = 'truth-or-dare' WHERE game_type = 'truth_dare';
      UPDATE public.game_sessions SET game_type = 'would-you-rather' WHERE game_type = 'would_you_rather';
    `);

        console.log('Migration complete!');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await client.end();
    }
}

runFix();
