-- COMPREHENSIVE RLS FIX
-- Problem: "Infinite recursion" because policies query the table they are protecting.
-- Solution: Use SECURITY DEFINER functions to bypass RLS for permission checks.

-- 1. Helper Function: Get all rooms I am a member of (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_room_ids()
RETURNS TABLE (room_id UUID) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT room_id FROM public.room_members WHERE user_id = auth.uid();
$$;

-- 2. Helper Function: Check if I am an owner of a specific room (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_room_owner(check_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = check_room_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  );
$$;

-- 3. Drop ALL existing policies on room_members to start fresh
DROP POLICY IF EXISTS "Members can view other members in their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Owners can insert members" ON public.room_members;
DROP POLICY IF EXISTS "Owners can update roles" ON public.room_members;
DROP POLICY IF EXISTS "Owners can remove members or members leave" ON public.room_members;

-- 4. Re-create Policies using the Safe Functions

-- SELECT: See yourself OR see others in rooms you belong to
CREATE POLICY "Safe View Members"
  ON public.room_members FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR
    room_id IN ( SELECT room_id FROM public.get_my_room_ids() )
  );

-- INSERT: Join yourself OR Owner adds you
CREATE POLICY "Safe Insert Members"
  ON public.room_members FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    OR
    public.is_room_owner(room_id)
  );

-- UPDATE: Only Owners
CREATE POLICY "Safe Update Members"
  ON public.room_members FOR UPDATE
  USING ( public.is_room_owner(room_id) );

-- DELETE: Leave yourself OR Owner removes you
CREATE POLICY "Safe Delete Members"
  ON public.room_members FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    public.is_room_owner(room_id)
  );
