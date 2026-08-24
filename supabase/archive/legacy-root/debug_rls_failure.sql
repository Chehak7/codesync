-- DEBUG RLS FAILURE (FIXED)
-- Run this to see what the database thinks about your permissions.

-- 1. Who am I?
SELECT auth.uid() as my_user_id, email FROM auth.users WHERE id = auth.uid();

-- 2. What rooms am I in?
SELECT 
    rm.room_id, 
    r.name as room_name, 
    rm.role,
    public.has_room_role(rm.room_id, 'editor') as can_edit_check
FROM public.room_members rm
JOIN public.rooms r ON r.id = rm.room_id
WHERE rm.user_id = auth.uid();

-- 3. Test Insert (Simulated)
DO $$
DECLARE
    v_room_id UUID;
    v_has_role BOOLEAN;
BEGIN
    SELECT room_id INTO v_room_id FROM public.room_members WHERE user_id = auth.uid() LIMIT 1;
    
    IF v_room_id IS NOT NULL THEN
        RAISE NOTICE 'Testing Room ID: %', v_room_id;
        
        -- Check function result specifically
        SELECT public.has_room_role(v_room_id, 'editor') INTO v_has_role;
        RAISE NOTICE 'has_room_role(editor) returns: %', v_has_role;
        
        -- Attempt Insert
        BEGIN
            INSERT INTO public.code_sessions (room_id, name, type)
            VALUES (v_room_id, 'debug_test_folder', 'folder');
            RAISE NOTICE 'Insert SUCCESS! (Rolling back now)';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Insert FAILED: % (SQL State: %)', SQLERRM, SQLSTATE;
        END;
    ELSE
        RAISE NOTICE 'No rooms found for this user.';
    END IF;
    
    -- Always rollback checks so we don't leave junk data
    RAISE EXCEPTION 'Test Complete (Rollback)';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM != 'Test Complete (Rollback)' THEN
        RAISE NOTICE 'Outer Block Error: %', SQLERRM;
    END IF;
END$$;
