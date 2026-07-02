-- Create a function to find a room by code bypassing RLS
-- This is necessary to allow users to join private rooms if they have the code.
CREATE OR REPLACE FUNCTION public.find_room_by_code(p_code TEXT)
RETURNS TABLE (id UUID) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT id FROM public.rooms WHERE room_code = p_code;
$$;
