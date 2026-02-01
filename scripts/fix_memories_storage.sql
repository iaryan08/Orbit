-- SQL to enable Storage Policies for 'memories' bucket

-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

-- 2. Allow Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'memories' );

-- 3. Allow Authenticated Users to Upload
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'memories' );

-- 4. Allow Authenticated Users to Update
create policy "Authenticated Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'memories' );
