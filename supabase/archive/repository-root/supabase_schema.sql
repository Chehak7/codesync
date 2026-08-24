-- Enable the Realtime extension
begin;
  -- drop publication if exists supabase_realtime;
  -- create publication supabase_realtime;
commit;

-- Note: This schema reflects the user's provided design.

create table rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  room_code text not null unique,
  owner_id uuid references auth.users(id),
  is_public boolean default false,
  max_participants int4 default 50
);

create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  joined_at timestamptz default now(),
  role text default 'member' -- 'owner', 'member', 'viewer'
);

create table code_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  file_name text not null,
  language text default 'typescript',
  code text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  message text not null,
  created_at timestamptz default now()
);

create table code_versions (
  id uuid primary key default gen_random_uuid(),
  code_session_id uuid references code_sessions(id) on delete cascade,
  code text not null,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- Enable Row Level Security
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table code_sessions enable row level security;
alter table chat_messages enable row level security;
alter table code_versions enable row level security;

-- Policies (Simplified for initial setup - User to customize)
create policy "Rooms are viewable by everyone" on rooms for select using (true);
create policy "Users can create rooms" on rooms for insert with check (auth.uid() = owner_id);
create policy "Room owners can update rooms" on rooms for update using (auth.uid() = owner_id);

create policy "Members can view room members" on room_members for select using (true);
create policy "Users can join rooms" on room_members for insert with check (auth.uid() = user_id);

create policy "Code visible to room members" on code_sessions for select using (true);
create policy "Authenticated can edit code" on code_sessions for update using (auth.role() = 'authenticated');
create policy "Authenticated can create code files" on code_sessions for insert with check (auth.role() = 'authenticated');

create policy "Chat visible to everyone" on chat_messages for select using (true);
create policy "Authenticated can send messages" on chat_messages for insert with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table code_sessions;
alter publication supabase_realtime add table chat_messages;
