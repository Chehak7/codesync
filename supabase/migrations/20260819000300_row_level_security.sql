begin;

-- Remove every manually created policy on canonical public tables before installing one model.
do $migration$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles',
        'private_profiles',
        'rooms',
        'room_members',
        'room_invitations',
        'messages',
        'code_sessions',
        'code_versions',
        'execution_history',
        'execution_rate_limits',
        'snippets'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$migration$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.private_profiles enable row level security;
alter table public.private_profiles force row level security;
alter table public.rooms enable row level security;
alter table public.rooms force row level security;
alter table public.room_members enable row level security;
alter table public.room_members force row level security;
alter table public.room_invitations enable row level security;
alter table public.room_invitations force row level security;
alter table public.messages enable row level security;
alter table public.messages force row level security;
alter table public.code_sessions enable row level security;
alter table public.code_sessions force row level security;
alter table public.code_versions enable row level security;
alter table public.code_versions force row level security;
alter table public.execution_history enable row level security;
alter table public.execution_history force row level security;
alter table public.execution_rate_limits enable row level security;
alter table public.execution_rate_limits force row level security;
alter table public.snippets enable row level security;
alter table public.snippets force row level security;

revoke usage on schema public from anon;
grant usage on schema public to authenticated;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.private_profiles from anon, authenticated;
revoke all on table public.rooms from anon, authenticated;
revoke all on table public.room_members from anon, authenticated;
revoke all on table public.room_invitations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.code_sessions from anon, authenticated;
revoke all on table public.code_versions from anon, authenticated;
revoke all on table public.execution_history from anon, authenticated;
revoke all on table public.execution_rate_limits from anon, authenticated;
revoke all on table public.snippets from anon, authenticated;

grant select, update (display_name, avatar_url) on public.profiles to authenticated;
grant select on public.private_profiles to authenticated;
grant select, update, delete on public.rooms to authenticated;
grant select, update, delete on public.room_members to authenticated;
grant select, delete on public.room_invitations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.code_sessions to authenticated;
grant select, insert, delete on public.code_versions to authenticated;
grant select, insert on public.execution_history to authenticated;
grant select, insert on public.execution_rate_limits to authenticated;
grant select, insert, update, delete on public.snippets to authenticated;

create policy profiles_read_display_fields
  on public.profiles
  for select
  to authenticated
  using (true);

create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy private_profiles_read_self
  on public.private_profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy rooms_read_visible
  on public.rooms
  for select
  to authenticated
  using (
    is_public
    or owner_id = auth.uid()
    or public.is_room_member(id)
  );

create policy rooms_update_owner
  on public.rooms
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy rooms_delete_owner
  on public.rooms
  for delete
  to authenticated
  using (owner_id = auth.uid());

create policy room_members_read_room
  on public.room_members
  for select
  to authenticated
  using (public.is_room_member(room_id));

-- There is deliberately no INSERT policy and authenticated has no INSERT grant.
-- create_room() and join_room() are the only membership writers.

create policy room_members_update_by_owner
  on public.room_members
  for update
  to authenticated
  using (
    public.is_room_owner(room_id)
    and user_id <> (
      select rooms.owner_id
      from public.rooms
      where rooms.id = room_members.room_id
    )
  )
  with check (
    public.is_room_owner(room_id)
    and role in ('editor', 'viewer')
    and user_id <> (
      select rooms.owner_id
      from public.rooms
      where rooms.id = room_members.room_id
    )
  );

create policy room_members_delete_self_or_owner
  on public.room_members
  for delete
  to authenticated
  using (
    (user_id = auth.uid() and role <> 'owner')
    or (
      public.is_room_owner(room_id)
      and user_id <> (
        select rooms.owner_id
        from public.rooms
        where rooms.id = room_members.room_id
      )
    )
  );

create policy room_invitations_read_participant
  on public.room_invitations
  for select
  to authenticated
  using (
    public.is_room_owner(room_id)
    or invited_user_id = auth.uid()
  );

create policy room_invitations_delete_owner
  on public.room_invitations
  for delete
  to authenticated
  using (public.is_room_owner(room_id));

create policy messages_read_member
  on public.messages
  for select
  to authenticated
  using (public.is_room_member(room_id));

create policy messages_insert_editor
  on public.messages
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.has_room_role(room_id, 'editor')
  );

create policy messages_update_author
  on public.messages
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.has_room_role(room_id, 'editor')
  )
  with check (
    user_id = auth.uid()
    and public.has_room_role(room_id, 'editor')
  );

create policy messages_delete_author_or_owner
  on public.messages
  for delete
  to authenticated
  using (
    (user_id = auth.uid() and public.has_room_role(room_id, 'editor'))
    or public.is_room_owner(room_id)
  );

create policy code_sessions_read_member
  on public.code_sessions
  for select
  to authenticated
  using (public.is_room_member(room_id));

create policy code_sessions_insert_editor
  on public.code_sessions
  for insert
  to authenticated
  with check (public.has_room_role(room_id, 'editor'));

create policy code_sessions_update_editor
  on public.code_sessions
  for update
  to authenticated
  using (public.has_room_role(room_id, 'editor'))
  with check (public.has_room_role(room_id, 'editor'));

create policy code_sessions_delete_editor
  on public.code_sessions
  for delete
  to authenticated
  using (public.has_room_role(room_id, 'editor'));

create policy code_versions_read_member
  on public.code_versions
  for select
  to authenticated
  using (public.is_room_member(room_id));

create policy code_versions_insert_editor
  on public.code_versions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.has_room_role(room_id, 'editor')
  );

create policy code_versions_delete_owner
  on public.code_versions
  for delete
  to authenticated
  using (public.is_room_owner(room_id));

create policy execution_history_read_member
  on public.execution_history
  for select
  to authenticated
  using (public.is_room_member(room_id));

create policy execution_history_insert_editor
  on public.execution_history
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.has_room_role(room_id, 'editor')
  );

create policy execution_rate_limits_read_self
  on public.execution_rate_limits
  for select
  to authenticated
  using (user_id = auth.uid());

create policy execution_rate_limits_insert_self
  on public.execution_rate_limits
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy snippets_read_visible
  on public.snippets
  for select
  to authenticated
  using (is_public or author_id = auth.uid());

create policy snippets_insert_self
  on public.snippets
  for insert
  to authenticated
  with check (author_id = auth.uid());

create policy snippets_update_self
  on public.snippets
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy snippets_delete_self
  on public.snippets
  for delete
  to authenticated
  using (author_id = auth.uid());

commit;
