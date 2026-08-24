begin;

-- A version's room and file must identify the same code_sessions row. This
-- makes mismatched roomId/fileId combinations fail even outside Server Actions.
alter table public.code_sessions
  drop constraint if exists code_sessions_id_room_id_key;
alter table public.code_sessions
  add constraint code_sessions_id_room_id_key unique (id, room_id);

alter table public.code_versions
  drop constraint if exists code_versions_code_session_id_fkey;
alter table public.code_versions
  drop constraint if exists code_versions_file_room_fkey;
alter table public.code_versions
  add constraint code_versions_file_room_fkey
  foreign key (code_session_id, room_id)
  references public.code_sessions(id, room_id)
  on delete cascade;

commit;
