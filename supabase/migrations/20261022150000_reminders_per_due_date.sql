-- Reminders were unique per (vehicle, category, threshold, recipient), with
-- no due date in the key. Once a registration fired its 30-day reminder,
-- renewing it and reaching 30 days before the new expiry hit that
-- constraint and was skipped by `on conflict do nothing`: each threshold
-- fired once per vehicle and category, ever. Adding the due date gives
-- every expiry date its own set of reminders; re-running the scan on the
-- same day stays idempotent.

-- Postgres generated (and truncated) the original constraint name, so look
-- it up instead of hard-coding it.
do $$
declare
  old_constraint text;
begin
  select conname into old_constraint
  from pg_constraint
  where conrelid = 'public.notifications'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 4;

  if old_constraint is not null then
    execute format(
      'alter table public.notifications drop constraint %I',
      old_constraint
    );
  end if;
end;
$$;

alter table public.notifications
  add constraint notifications_reminder_key
  unique (vehicle_id, category, due_date, threshold_days, recipient_id);

-- Same scan as before; only the conflict target changes.
create or replace function public.generate_due_reminders()
returns setof public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_company_id uuid := public.get_my_company_id();
begin
  return query
  insert into public.notifications (company_id, recipient_id, vehicle_id, category, threshold_days, due_date)
  select distinct v.company_id, recipient.id, v.id, dates.category, thresholds.threshold, dates.due_date
  from public.vehicles v
  join public.reminder_settings rs on rs.company_id = v.company_id
  cross join lateral unnest(rs.thresholds_days) as thresholds (threshold)
  cross join lateral (
    values
      ('registration', v.registration_expiry),
      ('insurance', v.insurance_expiry),
      ('inspection', v.inspection_expiry)
  ) as dates (category, due_date)
  cross join lateral (
    select p.id from public.profiles p
    where p.company_id = v.company_id and p.role in ('admin', 'fleet_manager')
    union
    select v.assigned_driver_id where v.assigned_driver_id is not null
  ) as recipient (id)
  where dates.due_date is not null
    and dates.due_date = current_date + thresholds.threshold
    and (caller_company_id is null or v.company_id = caller_company_id)
  on conflict (vehicle_id, category, due_date, threshold_days, recipient_id) do nothing
  returning *;
end;
$$;
