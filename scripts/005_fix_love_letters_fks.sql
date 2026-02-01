-- Fix foreign keys for love_letters to reference profiles instead of auth.users
-- This allows PostgREST to join love_letters with profiles
-- Note: We are reusing the constraint names but pointing them to profiles

do $$
begin
  -- Drop existing constraints if they exist (names might vary, but standard naming is table_column_fkey)
  -- detailed checking is hard in raw sql without inspecting information_schema, 
  -- but we can try dropping likely names or just altering if we know the structure.
  
  -- Attempt to drop possible constraint names. 
  -- If created via "references auth.users", it may be "love_letters_sender_id_fkey".
  
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'love_letters_sender_id_fkey') then
    alter table public.love_letters drop constraint love_letters_sender_id_fkey;
  end if;
  
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'love_letters_receiver_id_fkey') then
    alter table public.love_letters drop constraint love_letters_receiver_id_fkey;
  end if;

end $$;

-- Add new constraints pointing to profiles
alter table public.love_letters
  add constraint love_letters_sender_id_fkey
  foreign key (sender_id)
  references public.profiles(id)
  on delete cascade;

alter table public.love_letters
  add constraint love_letters_receiver_id_fkey
  foreign key (receiver_id)
  references public.profiles(id)
  on delete cascade;
