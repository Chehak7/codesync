-- ==============================================================================
-- 1. ROBUST CLEANUP
-- ==============================================================================

-- Drop triggers first to remove dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables in reverse dependency order (Child -> Parent)
DROP TABLE IF EXISTS public.execution_rate_limits;
DROP TABLE IF EXISTS public.execution_history;
DROP TABLE IF EXISTS public.code_versions;
DROP TABLE IF EXISTS public.code_sessions;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.room_members;
DROP TABLE IF EXISTS public.rooms;
DROP TABLE IF EXISTS public.profiles;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE CREATION (Parent -> Child)
-- ==============================================================================

-- 2.1 PROFILES (Depends on auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  avatar_url  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.2 ROOMS (Depends on profiles)
CREATE TABLE public.rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  room_code   TEXT UNIQUE NOT NULL,
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.3 ROOM MEMBERS (Depends on rooms, profiles)
CREATE TABLE public.room_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 2.4 MESSAGES (Depends on rooms, profiles)
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ
);

-- 2.5 CODE SESSIONS (Depends on rooms)
CREATE TABLE public.code_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  language    TEXT NOT NULL,
  code        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.6 CODE VERSIONS (Depends on rooms, code_sessions, profiles)
CREATE TABLE public.code_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  code_session_id UUID NOT NULL REFERENCES public.code_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  code            TEXT,
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.7 EXECUTION HISTORY (Depends on profiles, rooms)
CREATE TABLE public.execution_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  room_id         UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  language        TEXT NOT NULL,
  code            TEXT NOT NULL,
  stdin           TEXT,
  stdout          TEXT,
  stderr          TEXT,
  exit_code       INTEGER,
  execution_time  INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.8 RATA LIMITS (Depends on profiles)
CREATE TABLE public.execution_rate_limits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. ENABLE RLS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_rate_limits ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. POLICIES
-- ==============================================================================

-- 4.1 PROFILES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.2 ROOMS
CREATE POLICY "Anyone can read public rooms or rooms they are in"
  ON public.rooms FOR SELECT 
  USING (
    is_public = true 
    OR auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = rooms.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners can update rooms"
  ON public.rooms FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete rooms"
  ON public.rooms FOR DELETE USING (auth.uid() = owner_id);

-- 4.3 ROOM MEMBERS
CREATE POLICY "Members can view other members in their rooms"
  ON public.room_members FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.room_members rm 
    WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
  ));

CREATE POLICY "Owners can insert members"
  ON public.room_members FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id -- Joining yourself
    OR EXISTS ( -- Or added by owner
      SELECT 1 FROM public.room_members owners 
      WHERE owners.room_id = room_id AND owners.user_id = auth.uid() AND owners.role = 'owner'
    )
  );

CREATE POLICY "Owners can update roles"
  ON public.room_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.room_members owners 
    WHERE owners.room_id = room_id AND owners.user_id = auth.uid() AND owners.role = 'owner'
  ));

CREATE POLICY "Owners can remove members or members leave"
  ON public.room_members FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.room_members owners 
    WHERE owners.room_id = room_id AND owners.user_id = auth.uid() AND owners.role = 'owner'
  ));

-- 4.4 MESSAGES
CREATE POLICY "Room members can read messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Room members can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- 4.5 CODE SESSIONS
CREATE POLICY "Room members can view files"
  ON public.code_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = code_sessions.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Editors/Owners can create/edit files"
  ON public.code_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = code_sessions.room_id AND user_id = auth.uid() AND role IN ('owner', 'editor')
  ));

CREATE POLICY "Editors/Owners can update files"
  ON public.code_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = code_sessions.room_id AND user_id = auth.uid() AND role IN ('owner', 'editor')
  ));

CREATE POLICY "Editors/Owners can delete files"
  ON public.code_sessions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = code_sessions.room_id AND user_id = auth.uid() AND role IN ('owner', 'editor')
  ));

-- 4.6 CODE VERSIONS
CREATE POLICY "Room members can view versions"
  ON public.code_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = code_versions.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Editors/Owners can create versions"
  ON public.code_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = code_versions.room_id AND user_id = auth.uid() AND role IN ('owner', 'editor')
  ));

-- 4.7 EXECUTION HISTORY
CREATE POLICY "Users see their own history"
  ON public.execution_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert history"
  ON public.execution_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4.8 RATE LIMITS
CREATE POLICY "Users view own limits"
  ON public.execution_rate_limits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own limits"
  ON public.execution_rate_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (Runs safely if specific users already exist)
INSERT INTO public.profiles (id, email, avatar_url)
SELECT id, email, raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
