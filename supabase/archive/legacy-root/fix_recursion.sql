-- FIX INFINITE RECURSION IN RLS
-- The error occurs because the `room_members` policy queries itself, creating a loop.
-- Solution: Use a SECURITY DEFINER function to bypass RLS for the lookups.

-- 1. Create a helper function that runs with "System Permissions" (SECURITY DEFINER)
-- This allows us to check room membership without triggering the RLS loop.
CREATE OR REPLACE FUNCTION public.get_my_room_ids()
RETURNS TABLE (room_id UUID) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT room_id FROM public.room_members WHERE user_id = auth.uid();
$$;

-- 2. Drop the buggy recursive policy
DROP POLICY IF EXISTS "Members can view other members in their rooms" ON public.room_members;

-- 3. create the new "safe" policy
CREATE POLICY "Members can view other members in their rooms"
  ON public.room_members FOR SELECT 
  USING (
    -- You can always see yourself
    user_id = auth.uid() 
    OR
    -- You can see rows for rooms that you are returned by the safe function
    room_id IN ( SELECT room_id FROM public.get_my_room_ids() )
  );
