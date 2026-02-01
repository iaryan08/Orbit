-- Secure join couple function
-- This function allows a user to join a couple using a code
-- It runs with security definer to bypass RLS for the update

create or replace function public.join_couple_by_code(
  code text,
  joining_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_couple record;
begin
  -- Find the couple
  select * into target_couple
  from public.couples
  where couple_code = code;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid pair code');
  end if;
  
  -- Check if user is trying to join their own couple
  if target_couple.user1_id = joining_user_id then
    return jsonb_build_object('success', false, 'error', 'You cannot join your own couple code');
  end if;

  -- Check if couple is already full
  if target_couple.user2_id is not null then
    if target_couple.user2_id = joining_user_id then
       -- Already joined, just return success
       return jsonb_build_object('success', true, 'couple', row_to_json(target_couple));
    else
       return jsonb_build_object('success', false, 'error', 'This couple already has two members');
    end if;
  end if;

  -- Update the couple
  update public.couples
  set 
    user2_id = joining_user_id,
    paired_at = now()
  where id = target_couple.id;

  -- Update joining user's profile
  update public.profiles
  set couple_id = target_couple.id
  where id = joining_user_id;

  -- Return updated couple
  select * into target_couple from public.couples where id = target_couple.id;
  
  return jsonb_build_object('success', true, 'couple', row_to_json(target_couple));
end;
$$;
