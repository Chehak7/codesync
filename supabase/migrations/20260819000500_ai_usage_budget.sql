begin;

create table if not exists public.ai_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  input_chars integer not null,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_action_check
    check (action in ('completion', 'inline_suggestion')),
  constraint ai_usage_events_input_chars_check
    check (input_chars between 1 and 40000)
);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;
alter table public.ai_usage_events force row level security;

revoke all on table public.ai_usage_events from anon, authenticated;
grant select on table public.ai_usage_events to authenticated;

create policy ai_usage_events_read_self
  on public.ai_usage_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- Atomically reserves one AI request. Constants are server-controlled so callers cannot
-- weaken the budget: 5 requests/minute, 50 requests/day, and 250k input chars/day.
create or replace function public.reserve_ai_usage(
  p_action text,
  p_input_chars integer
)
returns table (allowed boolean, reason text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_minute_requests integer;
  v_daily_requests integer;
  v_daily_chars bigint;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_action not in ('completion', 'inline_suggestion') then
    raise exception 'invalid AI action' using errcode = '22023';
  end if;

  if p_input_chars is null or p_input_chars not between 1 and 40000 then
    raise exception 'invalid input size' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  delete from public.ai_usage_events
  where user_id = v_user_id
    and created_at < now() - interval '7 days';

  select
    count(*) filter (where created_at >= now() - interval '1 minute'),
    count(*),
    coalesce(sum(input_chars), 0)
  into v_minute_requests, v_daily_requests, v_daily_chars
  from public.ai_usage_events
  where user_id = v_user_id
    and created_at >= now() - interval '1 day';

  if v_minute_requests >= 5 then
    return query select false, 'minute_request_limit'::text;
    return;
  end if;

  if v_daily_requests >= 50 then
    return query select false, 'daily_request_limit'::text;
    return;
  end if;

  if v_daily_chars + p_input_chars > 250000 then
    return query select false, 'daily_input_budget'::text;
    return;
  end if;

  insert into public.ai_usage_events (user_id, action, input_chars)
  values (v_user_id, p_action, p_input_chars);

  return query select true, null::text;
end
$function$;

revoke all on function public.reserve_ai_usage(text, integer) from public, anon;
grant execute on function public.reserve_ai_usage(text, integer) to authenticated;

commit;
