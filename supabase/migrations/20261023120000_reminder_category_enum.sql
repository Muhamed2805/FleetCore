-- notifications.category was text with a check constraint. Generated
-- TypeScript types (npm run db:types) see such a column as plain string, so
-- the app had to keep its own list of values in sync by hand. As an enum it
-- comes out of the generator as the exact union, like every other category
-- column.

create type public.reminder_category as enum ('registration', 'insurance', 'inspection');

-- The check compares against text, which an enum column can't do, so it goes
-- first. The enum enforces the same three values.
alter table public.notifications
  drop constraint notifications_category_check;

alter table public.notifications
  alter column category type public.reminder_category
  using category::public.reminder_category;

-- Same scan as before; only the category literals are typed, since text
-- can't be inserted into an enum column without a cast.
create or replace function public.generate_due_reminders()
returns setof public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_company_id uuid := public.get_my_company_id();
begin
  -- No company means the cron route (service role) or a direct database
  -- session, which scan every company. Anyone else without a company
  -- (anon, or a user whose profile is gone) gets nothing.
  if caller_company_id is null
    and coalesce(auth.role(), 'service_role') <> 'service_role'
  then
    raise exception 'Not allowed';
  end if;

  return query
  insert into public.notifications (company_id, recipient_id, vehicle_id, category, threshold_days, due_date)
  select distinct v.company_id, recipient.id, v.id, dates.category, thresholds.threshold, dates.due_date
  from public.vehicles v
  join public.reminder_settings rs on rs.company_id = v.company_id
  cross join lateral unnest(rs.thresholds_days) as thresholds (threshold)
  cross join lateral (
    values
      ('registration'::public.reminder_category, v.registration_expiry),
      ('insurance'::public.reminder_category, v.insurance_expiry),
      ('inspection'::public.reminder_category, v.inspection_expiry)
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
