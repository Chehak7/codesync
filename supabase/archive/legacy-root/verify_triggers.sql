-- VERIFY TRIGGERS
-- Run this to see exactly what triggers are currently attached to auth.users

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- Expected Output:
-- ONLY 'on_auth_user_created' should be listed.
-- If you see 'create_user_profile_trigger' or anything else, the cleanup failed.
