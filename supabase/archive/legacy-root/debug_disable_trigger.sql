-- DISABLE TRIGGER SCRIPT
-- Run this, then try to Sign Up in the app.

-- 1. Drop our trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Check for OTHER triggers on auth.users that might be interfering
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- If you see any triggers other than what Supabase provides by default, they might be the cause.
