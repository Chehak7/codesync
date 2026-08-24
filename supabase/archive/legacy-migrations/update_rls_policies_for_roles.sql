-- Update RLS policies for role-based permissions

-- ============================================
-- CODE SESSIONS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view code sessions in their rooms" ON code_sessions;
DROP POLICY IF EXISTS "Users can insert code sessions in their rooms" ON code_sessions;
DROP POLICY IF EXISTS "Users can update code sessions in their rooms" ON code_sessions;
DROP POLICY IF EXISTS "Users can delete code sessions in their rooms" ON code_sessions;

-- New role-based policies
CREATE POLICY "Members can view code sessions in their rooms"
    ON code_sessions FOR SELECT
    USING (
        room_id IN (
            SELECT room_id FROM room_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and editors can insert code sessions"
    ON code_sessions FOR INSERT
    WITH CHECK (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Owners and editors can update code sessions"
    ON code_sessions FOR UPDATE
    USING (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Owners and editors can delete code sessions"
    ON code_sessions FOR DELETE
    USING (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON messages;
DROP POLICY IF EXISTS "Owners and editors can insert messages" ON messages;

-- New role-based policy
CREATE POLICY "Owners and editors can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
        AND user_id = auth.uid()
    );

-- ============================================
-- ROOM MEMBERS POLICIES (for role management)
-- ============================================

-- Only owners can update member roles
DROP POLICY IF EXISTS "Owners can update member roles" ON room_members;

CREATE POLICY "Owners can update member roles"
    ON room_members FOR UPDATE
    USING (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Only owners can remove members
DROP POLICY IF EXISTS "Owners can remove members" ON room_members;

CREATE POLICY "Owners can remove members"
    ON room_members FOR DELETE
    USING (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );
