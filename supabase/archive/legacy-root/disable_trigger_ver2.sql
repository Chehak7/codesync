-- DISABLE TRIGGER (VERSION 2)
-- We need to prove 100% if the trigger is the cause or if your project is broken.

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- NOW TRY TO SIGN UP.
-- If it works: The trigger logic was the problem.
-- If it fails: Your Supabase project/database is corrupted (e.g. auth schema issues).
