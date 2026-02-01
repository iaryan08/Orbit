-- Couples App Database Schema

-- Users profile table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  couple_id uuid,
  couple_code text unique,
  partner_id uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Couples table
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references auth.users(id) on delete cascade not null,
  user2_id uuid references auth.users(id) on delete cascade,
  couple_code text unique not null,
  created_at timestamp with time zone default now(),
  paired_at timestamp with time zone
);

-- Daily moods table
create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  couple_id uuid references public.couples(id) on delete cascade not null,
  emoji text not null,
  mood_text text,
  mood_date date default current_date not null,
  created_at timestamp with time zone default now(),
  unique(user_id, mood_date)
);

-- Love letters table
create table if not exists public.love_letters (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  couple_id uuid references public.couples(id) on delete cascade not null,
  title text not null,
  content text not null,
  unlock_date date,
  unlock_type text check (unlock_type in ('birthday', 'anniversary', 'custom', 'immediate')),
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Dares table (for Truth & Dare game)
create table if not exists public.dares (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  assigned_to uuid references auth.users(id) on delete cascade not null,
  assigned_by uuid references auth.users(id) on delete cascade not null,
  dare_text text not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Daily posts (auto-delete after 24h)
create table if not exists public.daily_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  couple_id uuid references public.couples(id) on delete cascade not null,
  content text,
  image_url text,
  expires_at timestamp with time zone default (now() + interval '24 hours'),
  created_at timestamp with time zone default now()
);

-- Game sessions
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  game_type text not null check (game_type in ('truth_dare', 'would_you_rather', 'compliment_challenge', 'this_or_that', 'love_language_quiz', 'predict_partner')),
  current_turn uuid references auth.users(id),
  game_data jsonb default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Daily generated content (Would You Rather, This or That, etc.)
create table if not exists public.daily_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('would_you_rather', 'this_or_that', 'love_language_quiz', 'predict_partner')),
  content jsonb not null,
  content_date date default current_date not null,
  created_at timestamp with time zone default now(),
  unique(content_type, content_date)
);

-- Memories table
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  description text,
  image_url text not null,
  memory_date date,
  category text check (category in ('meet1', 'meet2', 'meet3', 'meet4', 'meet5', 'online', 'personal')),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.moods enable row level security;
alter table public.love_letters enable row level security;
alter table public.dares enable row level security;
alter table public.daily_posts enable row level security;
alter table public.game_sessions enable row level security;
alter table public.daily_content enable row level security;
alter table public.memories enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can view partner profile" on public.profiles for select using (
  couple_id in (select couple_id from public.profiles where id = auth.uid())
);

-- Couples policies
create policy "Users can view own couple" on public.couples for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can create couple" on public.couples for insert with check (auth.uid() = user1_id);
create policy "Users can update own couple" on public.couples for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Moods policies (couple members can see each other's moods)
create policy "Users can view couple moods" on public.moods for select using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Users can insert own mood" on public.moods for insert with check (auth.uid() = user_id);
create policy "Users can update own mood" on public.moods for update using (auth.uid() = user_id);

-- Love letters policies
create policy "Users can view own letters" on public.love_letters for select using (
  sender_id = auth.uid() or receiver_id = auth.uid()
);
create policy "Users can send letters" on public.love_letters for insert with check (auth.uid() = sender_id);

-- Dares policies
create policy "Couple can view dares" on public.dares for select using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Users can create dares" on public.dares for insert with check (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Users can update dares" on public.dares for update using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);

-- Daily posts policies
create policy "Couple can view posts" on public.daily_posts for select using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Users can create posts" on public.daily_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on public.daily_posts for delete using (auth.uid() = user_id);

-- Game sessions policies
create policy "Couple can view games" on public.game_sessions for select using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Couple can create games" on public.game_sessions for insert with check (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Couple can update games" on public.game_sessions for update using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);

-- Daily content policies (public read for authenticated users)
create policy "Authenticated users can view daily content" on public.daily_content for select to authenticated using (true);

-- Memories policies
create policy "Couple can view memories" on public.memories for select using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
create policy "Users can add memories" on public.memories for insert with check (auth.uid() = user_id);
create policy "Users can delete own memories" on public.memories for delete using (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
