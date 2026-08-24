begin;

create extension if not exists pgcrypto with schema extensions;

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
        upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12)),
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

revoke all on function public.create_room(text, boolean) from public, anon;
grant execute on function public.create_room(text, boolean) to authenticated;

commit;
