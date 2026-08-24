begin;

create extension if not exists pgcrypto with schema extensions;

-- Public identity contains display-only fields. Email is migrated to private_profiles below.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

create table if not exists public.private_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  updated_at timestamptz not null default now()
);

-- The live database stored email in public.profiles. Preserve it before removing the column.
do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email'
  ) then
    execute $sql$
      insert into public.private_profiles (id, email, updated_at)
      select profiles.id, profiles.email, coalesce(profiles.updated_at, now())
      from public.profiles
      where profiles.email is not null
      on conflict (id) do update
        set email = excluded.email,
            updated_at = excluded.updated_at
    $sql$;
  end if;
end
$migration$;

insert into public.profiles (id, display_name, avatar_url, updated_at)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(users.email, '@', 1), ''),
    'User'
  ),
  nullif(users.raw_user_meta_data ->> 'avatar_url', ''),
  now()
from auth.users as users
on conflict (id) do update
set display_name = coalesce(
      nullif(public.profiles.display_name, ''),
      excluded.display_name
    ),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

insert into public.private_profiles (id, email, updated_at)
select users.id, users.email, now()
from auth.users as users
where users.email is not null
on conflict (id) do update
set email = excluded.email,
    updated_at = excluded.updated_at;

update public.profiles
set display_name = 'User'
where display_name is null or btrim(display_name) = '';

alter table public.profiles alter column display_name set not null;
alter table public.profiles alter column updated_at set default now();
alter table public.profiles alter column updated_at set not null;

do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email'
  ) then
    alter table public.profiles drop column email;
  end if;
end
$migration$;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_name_length check (char_length(btrim(name)) between 1 and 100),
  constraint rooms_code_format check (room_code ~ '^[A-Z0-9]{6,16}$')
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  constraint room_members_role_check check (role in ('owner', 'editor', 'viewer')),
  constraint room_members_room_user_unique unique (room_id, user_id)
);

create table if not exists public.room_invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'viewer',
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint room_invitations_role_check check (role in ('editor', 'viewer')),
  constraint room_invitations_expiry_check check (expires_at > created_at)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint messages_content_length check (char_length(content) between 1 and 5000)
);

create table if not exists public.code_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  language text,
  code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type text not null default 'file',
  parent_id uuid,
  constraint code_sessions_type_check check (type in ('file', 'folder')),
  constraint code_sessions_name_length check (char_length(btrim(name)) between 1 and 255),
  constraint code_sessions_folder_language_check check (type = 'file' or language is null)
);

create table if not exists public.code_versions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  code_session_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null default '',
  message text,
  created_at timestamptz not null default now(),
  constraint code_versions_message_length check (message is null or char_length(message) <= 500)
);

create table if not exists public.execution_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  language text not null,
  code text not null,
  stdin text,
  stdout text,
  stderr text,
  exit_code integer,
  execution_time integer,
  created_at timestamptz not null default now()
);

create table if not exists public.execution_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  executed_at timestamptz not null default now()
);

create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  language text not null,
  category text,
  code text not null,
  variables jsonb not null default '[]'::jsonb,
  shortcuts text,
  author_id uuid references public.profiles(id) on delete cascade,
  is_public boolean not null default false,
  usage_count integer not null default 0,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint snippets_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint snippets_usage_nonnegative check (usage_count >= 0)
);

-- Normalize constraints on the manually created live tables.
update public.room_members set role = 'editor' where role = 'member';

alter table public.rooms drop constraint if exists rooms_name_length;
alter table public.rooms add constraint rooms_name_length
  check (char_length(btrim(name)) between 1 and 100);
alter table public.rooms drop constraint if exists rooms_code_format;
alter table public.rooms add constraint rooms_code_format
  check (room_code ~ '^[A-Z0-9]{6,16}$');
alter table public.rooms alter column is_public set default false;
alter table public.rooms alter column is_public set not null;
alter table public.rooms alter column created_at set default now();
alter table public.rooms alter column updated_at set default now();

alter table public.room_members drop constraint if exists room_members_role_check;
alter table public.room_members add constraint room_members_role_check
  check (role in ('owner', 'editor', 'viewer'));
alter table public.room_members drop constraint if exists room_members_room_id_user_id_key;
alter table public.room_members drop constraint if exists room_members_room_user_unique;
alter table public.room_members add constraint room_members_room_user_unique unique (room_id, user_id);
alter table public.room_members alter column joined_at set default now();

alter table public.messages drop constraint if exists messages_content_length;
alter table public.messages add constraint messages_content_length
  check (char_length(content) between 1 and 5000);
alter table public.messages alter column created_at set default now();
alter table public.messages alter column updated_at set default now();

alter table public.code_sessions drop constraint if exists code_sessions_type_check;
alter table public.code_sessions add constraint code_sessions_type_check
  check (type in ('file', 'folder'));
alter table public.code_sessions drop constraint if exists code_sessions_name_length;
alter table public.code_sessions add constraint code_sessions_name_length
  check (char_length(btrim(name)) between 1 and 255);
alter table public.code_sessions drop constraint if exists code_sessions_folder_language_check;
alter table public.code_sessions add constraint code_sessions_folder_language_check
  check (type = 'file' or language is null);
alter table public.code_sessions alter column code set default '';
update public.code_sessions set code = '' where code is null;
alter table public.code_sessions alter column code set not null;

alter table public.code_sessions drop constraint if exists code_sessions_id_room_id_key;
alter table public.code_sessions add constraint code_sessions_id_room_id_key unique (id, room_id);
alter table public.code_sessions drop constraint if exists code_sessions_parent_id_fkey;
alter table public.code_sessions drop constraint if exists code_sessions_parent_room_fkey;
alter table public.code_sessions add constraint code_sessions_parent_room_fkey
  foreign key (parent_id, room_id)
  references public.code_sessions(id, room_id)
  on delete cascade;

alter table public.code_versions drop constraint if exists code_versions_code_session_id_fkey;
alter table public.code_versions drop constraint if exists code_versions_file_room_fkey;
alter table public.code_versions add constraint code_versions_file_room_fkey
  foreign key (code_session_id, room_id)
  references public.code_sessions(id, room_id)
  on delete cascade;
update public.code_versions set code = '' where code is null;
alter table public.code_versions alter column code set default '';
alter table public.code_versions alter column code set not null;
alter table public.code_versions drop constraint if exists code_versions_message_length;
alter table public.code_versions add constraint code_versions_message_length
  check (message is null or char_length(message) <= 500);

alter table public.snippets alter column variables set default '[]'::jsonb;
update public.snippets set variables = '[]'::jsonb where variables is null;
alter table public.snippets alter column variables set not null;
alter table public.snippets alter column is_public set default false;
update public.snippets set is_public = false where is_public is null;
alter table public.snippets alter column is_public set not null;
alter table public.snippets alter column usage_count set default 0;
update public.snippets set usage_count = 0 where usage_count is null;
alter table public.snippets alter column usage_count set not null;
alter table public.snippets drop constraint if exists snippets_title_length;
alter table public.snippets add constraint snippets_title_length
  check (char_length(btrim(title)) between 1 and 120);
alter table public.snippets drop constraint if exists snippets_usage_nonnegative;
alter table public.snippets add constraint snippets_usage_nonnegative
  check (usage_count >= 0);

insert into public.room_members (room_id, user_id, role)
select rooms.id, rooms.owner_id, 'owner'
from public.rooms
on conflict (room_id, user_id) do update set role = 'owner';

create index if not exists room_members_user_room_idx
  on public.room_members (user_id, room_id);
create index if not exists room_members_room_role_idx
  on public.room_members (room_id, role);
create index if not exists room_invitations_room_idx
  on public.room_invitations (room_id, expires_at);
create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at desc);
create index if not exists code_sessions_room_parent_idx
  on public.code_sessions (room_id, parent_id);
create index if not exists code_versions_file_created_idx
  on public.code_versions (code_session_id, created_at desc);
create index if not exists execution_history_room_created_idx
  on public.execution_history (room_id, created_at desc);
create index if not exists execution_rate_limits_user_executed_idx
  on public.execution_rate_limits (user_id, executed_at desc);
create index if not exists snippets_public_created_idx
  on public.snippets (is_public, created_at desc);

commit;
