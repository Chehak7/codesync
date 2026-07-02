-- FIX ORPHANED ROOMS & PERMISSIONS
-- This script ensures that EVERY room creator is correctly listed as an 'owner' member.
-- This fixes 'RLS Policy Violation' errors caused by missing membership records.

DO $$
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting orphaned room fix...';

    FOR r IN SELECT * FROM public.rooms
    LOOP
        -- 1. Ensure Owner is in room_members
        IF NOT EXISTS (
            SELECT 1 FROM public.room_members 
            WHERE room_id = r.id AND user_id = r.owner_id
        ) THEN
            RAISE NOTICE 'Fixing Orphaned Room: "%" (ID: %)', r.name, r.id;
            
            INSERT INTO public.room_members (room_id, user_id, role)
            VALUES (r.id, r.owner_id, 'owner')
            ON CONFLICT (room_id, user_id) DO NOTHING; -- Should be covered by logic, but safe check
            
            v_count := v_count + 1;
        ELSE
            -- 2. Ensure they have 'owner' role, not just 'viewer'
            UPDATE public.room_members 
            SET role = 'owner'
            WHERE room_id = r.id AND user_id = r.owner_id AND role != 'owner';
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % orphaned rooms. You should now have permission to create files.', v_count;
END$$;
