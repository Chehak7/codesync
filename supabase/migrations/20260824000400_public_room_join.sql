begin;

create or replace function public.join_public_room(p_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select rooms.id
    into v_room_id
  from public.rooms
  where rooms.id = p_room_id
    and rooms.is_public = true;

  if v_room_id is null then
    raise exception 'room is not public' using errcode = '42501';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (v_room_id, v_user_id, 'viewer')
  on conflict (room_id, user_id) do nothing;

  return v_room_id;
end
$function$;

revoke all on function public.join_public_room(uuid) from public, anon;
grant execute on function public.join_public_room(uuid) to authenticated;

commit;
