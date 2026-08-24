-- Migration: Update code_sessions for file explorer hierarchy
-- Description: Adds parent_id, type columns and renames file_name to name

-- 1. Rename file_name to name
ALTER TABLE code_sessions RENAME COLUMN file_name TO name;

-- 2. Add type column
ALTER TABLE code_sessions ADD COLUMN type TEXT NOT NULL DEFAULT 'file' CHECK (type IN ('file', 'folder'));

-- 3. Add parent_id column for nesting
ALTER TABLE code_sessions ADD COLUMN parent_id UUID REFERENCES code_sessions(id) ON DELETE CASCADE;

-- 4. Make language nullable (folders don't have language)
ALTER TABLE code_sessions ALTER COLUMN language DROP NOT NULL;

-- 5. Create index for parent_id
CREATE INDEX IF NOT EXISTS idx_code_sessions_parent_id ON code_sessions(parent_id);
