-- SQL to enable Storage Policies for 'avatars' bucket

-- 1. Create the bucket if it doesn't strictly exist (optional, verified in UI)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Allow Public Read Access (so profiles can load)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 3. Allow Authenticated Users to Upload
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- 4. Allow Users to Update/Delete their own files (Optional, assuming file ownership matching)
-- This is a bit looser, allowing any auth user to update for now to avoid complexity errors
create policy "Authenticated Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' );
