-- Create milestones table for Intimacy Mode
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  category text not null, -- e.g., 'first_kiss', 'first_date'
  milestone_date date,
  content_user1 text, -- Description by user1
  content_user2 text, -- Description by user2
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(couple_id, category)
);

-- RLS Policies
alter table public.milestones enable row level security;

create policy "Couple can view milestones" on public.milestones for select using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);

create policy "Couple can insert milestones" on public.milestones for insert with check (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);

create policy "Couple can update milestones" on public.milestones for update using (
  couple_id in (select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid())
);
