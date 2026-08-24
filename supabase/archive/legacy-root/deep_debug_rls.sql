-- DEEP DEBUG RLS (Impersonating User)
-- Run this to verify permissions AS IF you were logged in.

DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_room_id UUID;
    v_role TEXT;
    v_check_result BOOLEAN;
BEGIN
    -- 1. Grab the first user (likely you)
    SELECT id, email INTO v_user_id, v_user_email FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Impersonating User: % (%)', v_user_email, v_user_id;
    
    -- 2. Simulate Auth Context (Crucial for RLS checks)
    PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);
    PERFORM set_config('role', 'authenticated', true);
    
    -- 3. Check Room Membership Directly
    SELECT room_id, role INTO v_room_id, v_role 
    FROM public.room_members 
    WHERE user_id = v_user_id 
    LIMIT 1;
    
    IF v_room_id IS NULL THEN
        RAISE NOTICE 'CRITICAL: This user is NOT a member of any room. "createRoom" might have failed to add the owner.';
    ELSE
        RAISE NOTICE 'User is member of Room: % with Role: %', v_room_id, v_role;
        
        -- 4. Test the Safe Function
        -- We explicitly pass the user ID context by ensuring the function uses auth.uid() which we mocked above
        SELECT public.has_room_role(v_room_id, 'editor') INTO v_check_result;
        RAISE NOTICE 'Function "has_room_role(..., editor)" returns: %', v_check_result;
        
        -- 5. Test INSERT (Dry Run)
        BEGIN
            INSERT INTO public.code_sessions (room_id, name, type)
            VALUES (v_room_id, 'debug_impersonation_test', 'folder');
            RAISE NOTICE 'Insert Test: SUCCESS (Policy allowed it)';
        EXCEPTION
    WHEN OTHERS THEN
        IF lower(SQLERRM) LIKE '%policy%' OR SQLSTATE = '42501' THEN
            RAISE NOTICE 'Insert Test: FAILED (RLS Policy Violation)';
        ELSE
            RAISE NOTICE 'Insert Test: FAILED with error: % (State: %)', SQLERRM, SQLSTATE;
        END IF;
END;
    END IF;
    
    RAISE NOTICE '=== END DEBUG ===';
END$$;
