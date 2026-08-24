begin;

create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_role text;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select rooms.owner_id
    into v_owner_id
  from public.rooms
  where rooms.id = p_room_id
  for update;

  if v_owner_id is null then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  select members.role
    into v_role
  from public.room_members as members
  where members.room_id = p_room_id
    and members.user_id = v_user_id
  for update;

  if v_role is null then
    raise exception 'room membership not found' using errcode = 'P0002';
  end if;

  if v_owner_id = v_user_id or v_role = 'owner' then
    raise exception 'transfer ownership or delete the room before leaving'
      using errcode = '42501';
  end if;

  delete from public.room_members
  where room_id = p_room_id
    and user_id = v_user_id;
end
$function$;

revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;

commit;
