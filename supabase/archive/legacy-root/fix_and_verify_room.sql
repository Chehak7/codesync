-- FIX & VERIFY SPECIFIC ROOM
-- TARGET_ROOM_ID: 8bce4df0-6516-48bf-acb4-6d7cdfb5e5fb (From your logs)

DO $$
DECLARE
    v_room_id UUID := '8bce4df0-6516-48bf-acb4-6d7cdfb5e5fb';
    v_user_id UUID;
BEGIN
    -- 1. Identify User
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found to fix.';
        RETURN;
    END IF;

    -- 2. Simulate Auth (Required for RLS to accept the fix if we were using RLS, 
    -- but here we are superuser so we can just INSERT directly, 
    -- BUT we want to simulate the result with permissions).
    
    -- FORCE INSERT into room_members (Bypassing RLS by being superuser in SQL Editor)
    INSERT INTO public.room_members (room_id, user_id, role)
    VALUES (v_room_id, v_user_id, 'owner')
    ON CONFLICT (room_id, user_id) 
    DO UPDATE SET role = 'owner';
    
    RAISE NOTICE '✅ User % is now definitely OWNER of Room %', v_user_id, v_room_id;

    -- 3. VERIFY: Now try to create a folder AS the user
    PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);
    PERFORM set_config('role', 'authenticated', true);
    
    BEGIN
        INSERT INTO public.code_sessions (room_id, name, type)
        VALUES (v_room_id, 'test_folder_fix_verify', 'folder');
        RAISE NOTICE '✅ SUCCESS: Folder created successfully! (Permissions are fixed)';
        
        -- Clean up the test folder
        RAISE EXCEPTION 'Test Complete (Rollback Clean)';
    EXCEPTION 
        WHEN OTHERS THEN
            IF SQLERRM = 'Test Complete (Rollback Clean)' THEN
                -- All good
            ELSE
                RAISE NOTICE '❌ FAILURE: Still blocked. Error: %', SQLERRM;
            END IF;
    END;
END$$;
