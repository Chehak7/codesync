-- CHECK DB POLICIES & COLUMNS
SELECT 
    c.table_name, 
    c.column_name, 
    c.data_type 
FROM information_schema.columns c
WHERE table_name = 'code_sessions';

SELECT 
    proname, 
    prosrc 
FROM pg_proc 
WHERE proname = 'has_room_role';

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'code_sessions';
