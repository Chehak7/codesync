-- Update room_members role constraint to include 'member'
ALTER TABLE public.room_members 
DROP CONSTRAINT IF EXISTS room_members_role_check;

ALTER TABLE public.room_members 
ADD CONSTRAINT room_members_role_check 
CHECK (role IN ('owner', 'editor', 'viewer', 'member'));

-- Optional: Migrate legacy 'member' roles to 'editor' for better compatibility if desired
-- UPDATE public.room_members SET role = 'editor' WHERE role = 'member';
