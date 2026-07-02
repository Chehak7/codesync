-- DISABLE RLS FOR CODE_SESSIONS (The "Nuclear" Option)
-- Use this ONLY to verify if RLS is the blocker.

ALTER TABLE public.code_sessions DISABLE ROW LEVEL SECURITY;

-- Verify it's off
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'code_sessions';

DO $$
BEGIN
    RAISE NOTICE 'RLS has been DISABLED for code_sessions. You should be able to create files now.';
END $$;
