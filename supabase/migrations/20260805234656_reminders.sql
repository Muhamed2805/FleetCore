-- Phase 5: reminders — customizable thresholds, in-app notifications, and
-- the scan that generates them.
--
-- One reminder_settings row per company controls which day-thresholds
-- (default 30/15/7/1, fully customizable) fire a reminder, and whether
-- email is sent in addition to the in-app notification. generate_due_reminders()
-- does the scan: called by a regular user it's scoped to their own company
-- (for a manual "check now" button); called with no auth context (the
-- service-role cron route) it scans every company.

create table public.reminder_settings (
  company_id uuid primary key references public.companies (id) on delete cascade,
  thresholds_days integer[] not null default '{30,15,7,1}',
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  category text not null check (category in ('registration', 'insurance', 'inspection')),
  threshold_days integer not null,
  due_date date not null,
  is_read boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (vehicle_id, category, threshold_days, recipient_id)
);

create index notifications_recipient_id_idx
  on public.notifications (recipient_id, is_read);

alter table public.reminder_settings enable row level security;
alter table public.notifications enable row level security;

create trigger reminder_settings_set_updated_at
  before update on public.reminder_settings
  for each row execute function public.set_updated_at();

create policy "Members can view their company's reminder settings"
  on public.reminder_settings for select
  using (company_id = public.get_my_company_id());

create policy "Admins can update their company's reminder settings"
  on public.reminder_settings for update
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() = 'admin'
  );

create policy "Users can view their own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Users can update their own notifications"
  on public.notifications for update
  using (recipient_id = auth.uid());

-- Give every existing company default settings; new companies get theirs
-- from handle_new_user below.
insert into public.reminder_settings (company_id)
select id from public.companies
on conflict (company_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  insert into public.companies (name)
  values (coalesce(new.raw_user_meta_data ->> 'company_name', 'My Company'))
  returning id into new_company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    new_company_id,
    new.raw_user_meta_data ->> 'full_name',
    'admin'
  );

  insert into public.reminder_settings (company_id) values (new_company_id);

  return new;
end;
$$;

-- Scans vehicles whose registration/insurance/inspection expiry lands
-- exactly on one of the company's configured thresholds today, and
-- inserts one notification per (vehicle, category, threshold, recipient).
-- The unique constraint above makes repeated runs idempotent, so this is
-- safe to call from a daily cron as well as an on-demand "check now".
create function public.generate_due_reminders()
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
  on conflict (vehicle_id, category, threshold_days, recipient_id) do nothing
  returning *;
end;
$$;

grant execute on function public.generate_due_reminders() to authenticated;
