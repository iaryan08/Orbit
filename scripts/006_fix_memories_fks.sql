-- Fix user_id foreign key for memories to reference profiles instead of auth.users
-- This allows for better referential integrity with the public schema

do $$
begin
  -- Drop existing constraint if it exists (likely named memories_user_id_fkey)
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'memories_user_id_fkey') then
    alter table public.memories drop constraint memories_user_id_fkey;
  end if;
end $$;

-- Add new constraint pointing to profiles
alter table public.memories
  add constraint memories_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
