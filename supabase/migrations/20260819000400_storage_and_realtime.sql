begin;

create or replace function public.project_file_room_id(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $function$
  select case
    when split_part(object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then split_part(object_name, '/', 1)::uuid
    else null
  end
$function$;

revoke all on function public.project_file_room_id(text) from public, anon;
grant execute on function public.project_file_room_id(text) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit
)
values (
  'project-files',
  'project-files',
  false,
  5242880
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit;

-- Remove every policy tied to this bucket, including the three over-permissive live policies.
do $migration$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') like '%project-files%'
        or coalesce(with_check, '') like '%project-files%'
        or policyname = any (array[
          'Authenticated users can upload project files',
          'Authenticated users can read project files',
          'Users can delete their own project files',
          'project_files_read_member',
          'project_files_insert_editor',
          'project_files_update_editor',
          'project_files_delete_editor'
        ])
      )
  loop
    execute format('drop policy if exists %I on storage.objects', policy_record.policyname);
  end loop;
end
$migration$;

create policy project_files_read_member
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and public.project_file_room_id(name) is not null
    and public.is_room_member(public.project_file_room_id(name))
  );

create policy project_files_insert_editor
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and public.project_file_room_id(name) is not null
    and public.has_room_role(public.project_file_room_id(name), 'editor')
  );

create policy project_files_update_editor
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and public.project_file_room_id(name) is not null
    and public.has_room_role(public.project_file_room_id(name), 'editor')
  )
  with check (
    bucket_id = 'project-files'
    and public.project_file_room_id(name) is not null
    and public.has_room_role(public.project_file_room_id(name), 'editor')
  );

create policy project_files_delete_editor
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and public.project_file_room_id(name) is not null
    and public.has_room_role(public.project_file_room_id(name), 'editor')
  );

do $migration$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'rooms',
      'room_members',
      'messages',
      'code_sessions',
      'code_versions'
    ]
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          table_name
        );
      end if;
    end loop;
  end if;
end
$migration$;

commit;
