begin;

create or replace function public.can_access_chat_realtime_topic(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  topic_room_id uuid;
begin
  if p_topic !~* '^room:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:messages$' then
    return false;
  end if;

  topic_room_id := split_part(p_topic, ':', 2)::uuid;
  return public.is_room_member(topic_room_id);
exception
  when invalid_text_representation then
    return false;
end
$function$;

revoke all on function public.can_access_chat_realtime_topic(text) from public, anon;
grant execute on function public.can_access_chat_realtime_topic(text) to authenticated;

drop policy if exists chat_members_receive_typing on realtime.messages;
create policy chat_members_receive_typing
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and public.can_access_chat_realtime_topic((select realtime.topic()))
  );

drop policy if exists chat_members_send_typing on realtime.messages;
create policy chat_members_send_typing
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and public.can_access_chat_realtime_topic((select realtime.topic()))
  );

commit;
