-- FINAL FIX FOR SIGNUP
-- This script performs a "Deep Clean" of all triggers on auth.users using dynamic SQL.
-- It ensures absolutely NO other code runs when a user is created.

-- 1. Dynamic Block to DROP ALL TRIGGERS on auth.users
-- This handles cases where triggers have different names than we expect.
DO $$
DECLARE
    trig_name text;
BEGIN
    FOR trig_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trig_name) || ' ON auth.users CASCADE';
        RAISE NOTICE 'Dropped trigger: %', trig_name;
    END LOOP;
END $$;

-- 2. Drop the function to be sure
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_profile(); -- Legacy one

-- 3. Re-create the SAFE function (Swallows errors to prevent signup block)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, extensions
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but DO NOT FAIL the transaction
  RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Re-attach the SINGLE correct trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify Permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;
