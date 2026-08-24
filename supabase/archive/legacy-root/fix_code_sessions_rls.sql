-- FIX CODE SESSIONS RLS
-- Problem: Creating files/folders fails because RLS on 'code_sessions' tries to query 'room_members' but hits permissions issues.
-- Solution: Use a SECURITY DEFINER function to safely check roles.

-- 1. Helper Function: Check if I have a specific role in a room
CREATE OR REPLACE FUNCTION public.has_room_role(check_room_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- If checking for 'editor', allow 'owner' or 'editor'
  IF required_role = 'editor' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = check_room_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'editor', 'member')
    );
  -- If checking for 'viewer', allow anyone in the room
  ELSIF required_role = 'viewer' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = check_room_id 
      AND user_id = auth.uid()
    );
  ELSE
    -- Exact match for other roles (e.g. 'owner')
    RETURN EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = check_room_id 
      AND user_id = auth.uid() 
      AND role = required_role
    );
  END IF;
END;
$$;

-- 2. Drop existing policies on CODE_SESSIONS
DROP POLICY IF EXISTS "Room members can view files" ON public.code_sessions;
DROP POLICY IF EXISTS "Editors/Owners can create/edit files" ON public.code_sessions;
DROP POLICY IF EXISTS "Editors/Owners can update files" ON public.code_sessions;
DROP POLICY IF EXISTS "Editors/Owners can delete files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe View Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe View Files 2" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe Insert Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe Update Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe Delete Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe View Versions" ON public.code_versions;
DROP POLICY IF EXISTS "Safe Insert Versions" ON public.code_versions;

-- 3. Re-create Safe Policies for CODE_SESSIONS
CREATE POLICY "Safe View Files"
  ON public.code_sessions FOR SELECT
  USING ( public.has_room_role(room_id, 'viewer') );

CREATE POLICY "Safe Insert Files"
  ON public.code_sessions FOR INSERT
  WITH CHECK ( public.has_room_role(room_id, 'editor') );

CREATE POLICY "Safe Update Files"
  ON public.code_sessions FOR UPDATE
  USING ( public.has_room_role(room_id, 'editor') );

CREATE POLICY "Safe Delete Files"
  ON public.code_sessions FOR DELETE
  USING ( public.has_room_role(room_id, 'editor') );


-- 4. Do the same for CODE_VERSIONS (Just in case)
DROP POLICY IF EXISTS "Room members can view versions" ON public.code_versions;
DROP POLICY IF EXISTS "Editors/Owners can create versions" ON public.code_versions;

CREATE POLICY "Safe View Versions"
  ON public.code_versions FOR SELECT
  USING ( public.has_room_role(room_id, 'viewer') );

CREATE POLICY "Safe Insert Versions"
  ON public.code_versions FOR INSERT
  WITH CHECK ( public.has_room_role(room_id, 'editor') );
