-- ==============================================================================
-- 1. STORAGE SETUP (Required for File Imports)
-- ==============================================================================

-- Create the bucket "project-files" if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to read files
CREATE POLICY "Authenticated users can read project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own files (Optional but good for cleanup)
CREATE POLICY "Users can delete their own project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' 
  AND auth.uid() = owner
);

-- ==============================================================================
-- 2. REALTIME SETUP (Required for Chat & Editor Collaboration)
-- ==============================================================================

-- Add tables to the realtime publication so the client can subscribe to changes
-- Note: 'supabase_realtime' is the default publication created by Supabase.

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
