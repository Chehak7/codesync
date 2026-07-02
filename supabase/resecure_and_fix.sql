ALTER TABLE public.code_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS Re-enabled for code_sessions'; 
END $$;

DROP POLICY IF EXISTS "Safe View Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe Insert Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe Update Files" ON public.code_sessions;
DROP POLICY IF EXISTS "Safe Delete Files" ON public.code_sessions;

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

DO $$
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    FOR r IN SELECT * FROM public.rooms
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.room_members 
            WHERE room_id = r.id AND user_id = r.owner_id
        ) THEN
            INSERT INTO public.room_members (room_id, user_id, role)
            VALUES (r.id, r.owner_id, 'owner');
            v_count := v_count + 1;
        END IF;
    END LOOP;
    RAISE NOTICE '✅ Fixed % orphaned rooms (You are now properly linked)', v_count;
END$$;
