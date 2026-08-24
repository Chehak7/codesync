-- DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor

-- 1. Check if tables exist (This query just runs without error if tables exist)
SELECT count(*) FROM public.profiles;

-- 2. Temporarily DROP the trigger to see if Signup works without it.
-- If this fixes the signup error, we know specifically the trigger body is crashing.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Ensure profiles table definitely exists (Idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  avatar_url  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Grant explicit permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
