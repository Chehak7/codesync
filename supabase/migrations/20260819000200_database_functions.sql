begin;

-- Remove manually created helpers and trigger functions that are not part of the canonical model.
drop function if exists public.find_room_by_code(text);
drop function if exists public.get_my_room_ids();
drop function if exists public.add_owner_as_member() cascade;
drop function if exists public.check_room_capacity() cascade;
drop function if exists public.create_default_code_session() cascade;
drop function if exists public.prevent_owner_removal() cascade;
drop function if exists public.set_version_number() cascade;
drop function if exists public.generate_invitation_code();

create or replace function public.current_room_role(p_room_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select members.role
  from public.room_members as members
  where members.room_id = p_room_id
    and members.user_id = auth.uid()
  limit 1
$function$;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.room_members as members
    where members.room_id = p_room_id
      and members.user_id = auth.uid()
  )
$function$;

create or replace function public.has_room_role(p_room_id uuid, p_required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    case public.current_room_role(p_room_id)
      when 'owner' then 3
      when 'editor' then 2
      when 'viewer' then 1
      else 0
    end >=
    case p_required_role
      when 'owner' then 3
      when 'editor' then 2
      when 'viewer' then 1
      else 99
    end,
    false
  )
$function$;

create or replace function public.is_room_owner(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.has_room_role(p_room_id, 'owner')
$function$;

-- Compatibility helper retained for application callers, but no longer exposes membership rows.
create or replace function public.get_user_room_role(r_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select public.current_room_role(r_id)
$function$;

create or replace function public.check_room_access(r_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.is_room_member(r_id)
$function$;

create or replace function public.generate_room_code()
returns text
language sql
volatile
set search_path = ''
as $function$
  select upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12))
$function$;

-- Room creation and owner membership are one transaction and cannot be split.
create or replace function public.create_room(
  p_name text,
  p_is_public boolean default false
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms;
  v_attempt integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 100 then
    raise exception 'room name must contain between 1 and 100 characters'
      using errcode = '22023';
  end if;

  for v_attempt in 1..5 loop
    begin
      insert into public.rooms (name, room_code, owner_id, is_public)
      values (
        btrim(p_name),
        public.generate_room_code(),
        v_user_id,
        coalesce(p_is_public, false)
      )
      returning * into v_room;
      exit;
    exception when unique_violation then
      if v_attempt = 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, v_user_id, 'owner');

  return v_room;
end
$function$;

-- Membership can only be created here. Callers cannot choose their user id or elevate a role.
-- A room code grants editor access, a public-room id grants viewer access, and an invitation
-- grants the editor/viewer role stored by the room owner.
create or replace function public.join_room(
  p_code text default null,
  p_room_id uuid default null,
  p_invitation_token uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid;
  v_role text;
  v_invitation_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if num_nonnulls(p_code, p_room_id, p_invitation_token) <> 1 then
    raise exception 'provide exactly one room code, public room id, or invitation token'
      using errcode = '22023';
  end if;

  if p_invitation_token is not null then
    select invitations.id, invitations.room_id, invitations.role
      into v_invitation_id, v_room_id, v_role
    from public.room_invitations as invitations
    where invitations.token = p_invitation_token
      and invitations.accepted_at is null
      and invitations.expires_at > now()
      and (
        invitations.invited_user_id is null
        or invitations.invited_user_id = v_user_id
      )
    for update;

    if v_room_id is null then
      raise exception 'invalid or expired invitation' using errcode = '42501';
    end if;
  elsif p_code is not null then
    select
      rooms.id,
      case when rooms.is_public then 'viewer' else 'editor' end
      into v_room_id, v_role
    from public.rooms
    where rooms.room_code = upper(btrim(p_code));

    if v_room_id is null then
      raise exception 'invalid room code' using errcode = '42501';
    end if;
  else
    select rooms.id into v_room_id
    from public.rooms
    where rooms.id = p_room_id
      and rooms.is_public = true;

    v_role := 'viewer';

    if v_room_id is null then
      raise exception 'room is not public' using errcode = '42501';
    end if;
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (v_room_id, v_user_id, v_role)
  on conflict (room_id, user_id) do nothing;

  if v_invitation_id is not null then
    update public.room_invitations
    set accepted_at = now()
    where id = v_invitation_id;
  end if;

  return v_room_id;
end
$function$;

create or replace function public.create_room_invitation(
  p_room_id uuid,
  p_role text default 'viewer',
  p_invited_user_id uuid default null,
  p_expires_at timestamptz default (now() + interval '7 days')
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_token uuid;
begin
  if not public.is_room_owner(p_room_id) then
    raise exception 'only room owners can create invitations' using errcode = '42501';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'invitation role must be editor or viewer' using errcode = '22023';
  end if;

  if p_expires_at <= now() then
    raise exception 'invitation expiry must be in the future' using errcode = '22023';
  end if;

  insert into public.room_invitations (
    room_id,
    invited_user_id,
    role,
    created_by,
    expires_at
  )
  values (
    p_room_id,
    p_invited_user_id,
    p_role,
    auth.uid(),
    p_expires_at
  )
  returning token into v_token;

  return v_token;
end
$function$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end
$function$;

create or replace function public.prevent_membership_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.room_id <> old.room_id or new.user_id <> old.user_id then
    raise exception 'room membership identity cannot be changed' using errcode = '42501';
  end if;
  return new;
end
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'User'
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
  set display_name = excluded.display_name,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();

  if new.email is not null then
    insert into public.private_profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  end if;

  return new;
end
$function$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists create_user_profile_trigger on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists private_profiles_set_updated_at on public.private_profiles;
create trigger private_profiles_set_updated_at
  before update on public.private_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

drop trigger if exists code_sessions_set_updated_at on public.code_sessions;
create trigger code_sessions_set_updated_at
  before update on public.code_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists snippets_set_updated_at on public.snippets;
create trigger snippets_set_updated_at
  before update on public.snippets
  for each row execute function public.set_updated_at();

drop trigger if exists room_members_prevent_reassignment on public.room_members;
create trigger room_members_prevent_reassignment
  before update on public.room_members
  for each row execute function public.prevent_membership_reassignment();

revoke all on function public.current_room_role(uuid) from public, anon;
revoke all on function public.is_room_member(uuid) from public, anon;
revoke all on function public.has_room_role(uuid, text) from public, anon;
revoke all on function public.is_room_owner(uuid) from public, anon;
revoke all on function public.get_user_room_role(uuid) from public, anon;
revoke all on function public.check_room_access(uuid) from public, anon;
revoke all on function public.generate_room_code() from public, anon, authenticated;
revoke all on function public.create_room(text, boolean) from public, anon;
revoke all on function public.join_room(text, uuid, uuid) from public, anon;
revoke all on function public.create_room_invitation(uuid, text, uuid, timestamptz) from public, anon;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_membership_reassignment() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.current_room_role(uuid) to authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.has_room_role(uuid, text) to authenticated;
grant execute on function public.is_room_owner(uuid) to authenticated;
grant execute on function public.get_user_room_role(uuid) to authenticated;
grant execute on function public.check_room_access(uuid) to authenticated;
grant execute on function public.create_room(text, boolean) to authenticated;
grant execute on function public.join_room(text, uuid, uuid) to authenticated;
grant execute on function public.create_room_invitation(uuid, text, uuid, timestamptz) to authenticated;

commit;
