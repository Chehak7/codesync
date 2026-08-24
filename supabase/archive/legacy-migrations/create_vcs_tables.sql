-- Add message column and room_id to code_versions
ALTER TABLE code_versions ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE code_versions ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;

-- Create storage bucket for exports
-- Note: This requires appropriate permissions on the storage.buckets table
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for code_versions
ALTER TABLE code_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view versions in their rooms"
    ON code_versions FOR SELECT
    USING (
        room_id IN (
            SELECT room_id FROM room_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and editors can create versions"
    ON code_versions FOR INSERT
    WITH CHECK (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
        AND user_id = auth.uid()
    );
