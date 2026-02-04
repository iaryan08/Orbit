create table if not exists push_subscriptions (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can insert their own subscriptions"
  on push_subscriptions for insert
  with check (true);

create policy "Users can view their own subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can view all subscriptions"
  on push_subscriptions for select
  to service_role
  using (true);
