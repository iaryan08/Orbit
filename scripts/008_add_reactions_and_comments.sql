-- Add reactions and comments for memories and polaroids

-- Memory Reactions Table
create table if not exists public.memory_reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references public.memories(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default now(),
  unique(memory_id, user_id, emoji)
);

-- Memory Comments Table
create table if not exists public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references public.memories(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Polaroid Reactions Table
create table if not exists public.polaroid_reactions (
  id uuid primary key default gen_random_uuid(),
  polaroid_id uuid references public.polaroids(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default now(),
  unique(polaroid_id, user_id, emoji)
);

-- Polaroid Comments Table
create table if not exists public.polaroid_comments (
  id uuid primary key default gen_random_uuid(),
  polaroid_id uuid references public.polaroids(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.memory_reactions enable row level security;
alter table public.memory_comments enable row level security;
alter table public.polaroid_reactions enable row level security;
alter table public.polaroid_comments enable row level security;

-- Memory Reactions Policies
create policy "Couple can view memory reactions" on public.memory_reactions for select using (
  memory_id in (select id from public.memories where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Couple can add memory reactions" on public.memory_reactions for insert with check (
  user_id = auth.uid() and
  memory_id in (select id from public.memories where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Users can delete own memory reactions" on public.memory_reactions for delete using (
  user_id = auth.uid()
);

-- Memory Comments Policies
create policy "Couple can view memory comments" on public.memory_comments for select using (
  memory_id in (select id from public.memories where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Couple can add memory comments" on public.memory_comments for insert with check (
  user_id = auth.uid() and
  memory_id in (select id from public.memories where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Users can update own memory comments" on public.memory_comments for update using (
  user_id = auth.uid()
);

create policy "Users can delete own memory comments" on public.memory_comments for delete using (
  user_id = auth.uid()
);

-- Polaroid Reactions Policies
create policy "Couple can view polaroid reactions" on public.polaroid_reactions for select using (
  polaroid_id in (select id from public.polaroids where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Couple can add polaroid reactions" on public.polaroid_reactions for insert with check (
  user_id = auth.uid() and
  polaroid_id in (select id from public.polaroids where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Users can delete own polaroid reactions" on public.polaroid_reactions for delete using (
  user_id = auth.uid()
);

-- Polaroid Comments Policies
create policy "Couple can view polaroid comments" on public.polaroid_comments for select using (
  polaroid_id in (select id from public.polaroids where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Couple can add polaroid comments" on public.polaroid_comments for insert with check (
  user_id = auth.uid() and
  polaroid_id in (select id from public.polaroids where couple_id in (
    select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
  ))
);

create policy "Users can update own polaroid comments" on public.polaroid_comments for update using (
  user_id = auth.uid()
);

create policy "Users can delete own polaroid comments" on public.polaroid_comments for delete using (
  user_id = auth.uid()
);

-- Enable Realtime for instant updates
alter publication supabase_realtime add table public.memory_reactions;
alter publication supabase_realtime add table public.memory_comments;
alter publication supabase_realtime add table public.polaroid_reactions;
alter publication supabase_realtime add table public.polaroid_comments;
