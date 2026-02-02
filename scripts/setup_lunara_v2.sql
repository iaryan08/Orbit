-- Create table for daily couple insights (cached)
create table if not exists public.couple_insights (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) not null,
  insight_date date not null,
  content jsonb not null, -- { title, content, image_url, category }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (couple_id, insight_date)
);

-- Add RLS policies for couple_insights
alter table public.couple_insights enable row level security;

create policy "Couples can view their own insights"
  on public.couple_insights for select
  using (
    auth.uid() in (
      select user1_id from couples where id = couple_insights.couple_id
      union
      select user2_id from couples where id = couple_insights.couple_id
    )
  );

create policy "Users can insert insights for their couple"
  on public.couple_insights for insert
  with check (
    auth.uid() in (
      select user1_id from couples where id = couple_insights.couple_id
      union
      select user2_id from couples where id = couple_insights.couple_id
    )
  );

-- Add sex_drive to cycle_logs if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'cycle_logs' and column_name = 'sex_drive') then
    alter table public.cycle_logs add column sex_drive text check (sex_drive in ('low', 'medium', 'high', 'very_high'));
  end if;
end $$;
