-- Enable RLS on objects (it should be on by default, but good to ensure)
alter table storage.objects enable row level security;

-- 1. Create the 'memories' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts/duplicates
drop policy if exists "Public Access Memories" on storage.objects;
drop policy if exists "Authenticated Upload Memories" on storage.objects;
drop policy if exists "Authenticated Update Memories" on storage.objects;
drop policy if exists "Authenticated Delete Memories" on storage.objects;

-- 3. Allow Public Read Access (anyone can view images)
create policy "Public Access Memories"
on storage.objects for select
using ( bucket_id = 'memories' );

-- 4. Allow Authenticated Users to Upload
create policy "Authenticated Upload Memories"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'memories' );

-- 5. Allow Authenticated Users to Update their own files (optional, but good practice)
create policy "Authenticated Update Memories"
on storage.objects for update
to authenticated
using ( bucket_id = 'memories' );

-- 6. Allow Authenticated Users to Delete (optional)
create policy "Authenticated Delete Memories"
on storage.objects for delete
to authenticated
using ( bucket_id = 'memories' );
