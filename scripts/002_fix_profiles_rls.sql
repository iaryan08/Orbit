-- Fix infinite recursion in profiles RLS policy
-- The "Users can view partner profile" policy causes recursion by querying profiles table

-- Drop the problematic policy
drop policy if exists "Users can view partner profile" on public.profiles;

-- Create a fixed policy that uses the couples table instead of self-referencing
-- This avoids the infinite recursion by checking couple membership through the couples table
create policy "Users can view partner profile" on public.profiles for select using (
  id = auth.uid() 
  or 
  id in (
    select case 
      when user1_id = auth.uid() then user2_id 
      when user2_id = auth.uid() then user1_id 
    end
    from public.couples 
    where user1_id = auth.uid() or user2_id = auth.uid()
  )
);
