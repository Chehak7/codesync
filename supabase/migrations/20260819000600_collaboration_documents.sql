begin;

create table if not exists public.collaboration_documents (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  state_base64 text not null,
  state_bytes integer not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint collaboration_documents_state_size_check
    check (state_bytes between 0 and 5242880),
  constraint collaboration_documents_encoded_size_check
    check (char_length(state_base64) <= 7000000),
  constraint collaboration_documents_revision_check
    check (revision > 0)
);

alter table public.collaboration_documents enable row level security;
alter table public.collaboration_documents force row level security;

revoke all on table public.collaboration_documents from anon, authenticated;
grant select, insert, update, delete on table public.collaboration_documents to service_role;

-- Persists the binary Y.Doc snapshot and its plain-text file projections in one transaction.
-- Only the collaboration service's service-role client can execute this function.
create or replace function public.persist_collaboration_document(
  p_room_id uuid,
  p_state_base64 text,
  p_state_bytes integer,
  p_files jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_revision bigint;
  v_file jsonb;
  v_total_content_bytes bigint;
begin
  if p_state_bytes is null or p_state_bytes not between 0 and 5242880 then
    raise exception 'collaboration document exceeds the 5 MiB limit'
      using errcode = '22023';
  end if;

  if p_state_base64 is null or char_length(p_state_base64) > 7000000 then
    raise exception 'invalid collaboration document encoding'
      using errcode = '22023';
  end if;

  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) > 500 then
    raise exception 'invalid collaboration file projection'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_files) as files(value)
    where jsonb_typeof(files.value) <> 'object'
      or coalesce(files.value ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(jsonb_typeof(files.value -> 'content'), '') <> 'string'
      or octet_length(files.value ->> 'content') > 1048576
  ) then
    raise exception 'invalid collaboration file entry'
      using errcode = '22023';
  end if;

  select coalesce(sum(octet_length(files.value ->> 'content')), 0)
  into v_total_content_bytes
  from jsonb_array_elements(p_files) as files(value);

  if v_total_content_bytes > 5242880 then
    raise exception 'collaboration file projection exceeds the 5 MiB limit'
      using errcode = '22023';
  end if;

  insert into public.collaboration_documents (
    room_id,
    state_base64,
    state_bytes,
    revision,
    updated_at
  )
  values (p_room_id, p_state_base64, p_state_bytes, 1, now())
  on conflict (room_id) do update
  set state_base64 = excluded.state_base64,
      state_bytes = excluded.state_bytes,
      revision = public.collaboration_documents.revision + 1,
      updated_at = now()
  returning revision into v_revision;

  for v_file in
    select files.value
    from jsonb_array_elements(p_files) as files(value)
  loop
    update public.code_sessions
    set code = v_file ->> 'content',
        updated_at = now()
    where id = (v_file ->> 'id')::uuid
      and room_id = p_room_id
      and type = 'file';
  end loop;

  return v_revision;
end
$function$;

revoke all on function public.persist_collaboration_document(uuid, text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.persist_collaboration_document(uuid, text, integer, jsonb)
  to service_role;

commit;
