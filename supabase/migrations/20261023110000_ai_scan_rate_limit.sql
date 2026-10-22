-- Rate limit for AI document scans.
--
-- Every scan is a paid Anthropic API call. The limit lives in the database,
-- not in server memory, because a serverless deployment runs many short-lived
-- instances that don't share memory.
--
-- Each scan is logged in ai_scan_events. consume_ai_scan() checks the log
-- and records the scan in one step:
--   - at most 30 scans per user per hour;
--   - at most 200 scans per company per day.
-- The server action calls it before contacting Anthropic, so failed or
-- unreadable scans count too.

create table public.ai_scan_events (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ai_scan_events_company_created_idx
  on public.ai_scan_events (company_id, created_at);
create index ai_scan_events_user_created_idx
  on public.ai_scan_events (user_id, created_at);

-- RLS with no policies: clients can't read or write the log directly; only
-- consume_ai_scan() (security definer) touches it.
alter table public.ai_scan_events enable row level security;
revoke all on public.ai_scan_events from anon, authenticated;

-- Returns true and records the scan when the caller is under both limits,
-- false otherwise. Calling it directly only uses up the caller's own quota.
create function public.consume_ai_scan()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_user_per_hour constant int := 30;
  max_per_company_per_day constant int := 200;
  caller_id uuid := auth.uid();
  caller_company_id uuid := public.get_my_company_id();
begin
  if caller_id is null or caller_company_id is null then
    raise exception 'Not allowed';
  end if;

  -- Two scans of the same company at once would otherwise both see the same
  -- count and both pass. The lock is held until the transaction ends.
  perform pg_advisory_xact_lock(hashtextextended('ai_scan:' || caller_company_id::text, 0));

  if (
    select count(*) from public.ai_scan_events
    where user_id = caller_id and created_at > now() - interval '1 hour'
  ) >= max_per_user_per_hour
  or (
    select count(*) from public.ai_scan_events
    where company_id = caller_company_id and created_at > now() - interval '1 day'
  ) >= max_per_company_per_day
  then
    return false;
  end if;

  insert into public.ai_scan_events (company_id, user_id)
  values (caller_company_id, caller_id);

  -- Nothing older than a day is ever counted, so the log stays small.
  delete from public.ai_scan_events
  where company_id = caller_company_id and created_at < now() - interval '1 day';

  return true;
end;
$$;

revoke execute on function public.consume_ai_scan() from public, anon;
grant execute on function public.consume_ai_scan() to authenticated;
