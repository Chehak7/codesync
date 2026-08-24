begin;

create table if not exists public.room_invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('editor', 'viewer')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.room_invitations enable row level security;
revoke all on table public.room_invitations from anon, authenticated;

create or replace function public.create_room_invitation(
  p_room_id uuid,
  p_role text default 'viewer'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_token uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception 'invitation role must be editor or viewer' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.rooms
    where id = p_room_id and owner_id = auth.uid()
  ) then
    raise exception 'only the room owner can create invitations' using errcode = '42501';
  end if;

  insert into public.room_invitations (room_id, role, created_by)
  values (p_room_id, p_role, auth.uid())
  returning token into v_token;
  return v_token;
end
$function$;

create or replace function public.accept_room_invitation(p_invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.room_invitations;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.room_invitations
  where token = p_invitation_token
    and accepted_at is null
    and expires_at > now()
    and (invited_user_id is null or invited_user_id = v_user_id)
  for update;

  if v_invitation.id is null then
    raise exception 'invalid or expired invitation' using errcode = '42501';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (v_invitation.room_id, v_user_id, v_invitation.role)
  on conflict (room_id, user_id) do update
  set role = case
    when public.room_members.role = 'owner' then 'owner'
    when public.room_members.role = 'editor' then 'editor'
    else excluded.role
  end;

  update public.room_invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.room_id;
end
$function$;

revoke all on function public.create_room_invitation(uuid, text) from public, anon;
revoke all on function public.accept_room_invitation(uuid) from public, anon;
grant execute on function public.create_room_invitation(uuid, text) to authenticated;
grant execute on function public.accept_room_invitation(uuid) to authenticated;

commit;
