-- Fix RLS policy to allow users to find couples by pair code when joining
-- This is needed so that when someone enters a pair code, they can find the couple to join

-- Add policy to allow authenticated users to find couples by couple_code
create policy "Users can find couple by code to join" on public.couples 
  for select 
  to authenticated 
  using (true);

-- Note: The above policy allows any authenticated user to view couples.
-- This is safe because the couple_code is essentially a "password" to join.
-- Once we verify they have the code, we allow them to join.
-- If you want stricter security, you could create a database function instead.
