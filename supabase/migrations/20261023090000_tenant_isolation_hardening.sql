-- Tenant isolation hardening.
--
-- 1. Profiles: a member could never be moved between companies through the
--    app, but the "update own profile" policy plus the old trigger let an
--    admin set their own company_id to any company id and join it as admin.
--    Company ids are not secret (they lead every storage path, so they show
--    up in shared document links). company_id is now immutable for user
--    sessions, and users can only update their own full_name.
-- 2. generate_due_reminders() was executable by anon (functions grant
--    EXECUTE to PUBLIC by default). With no session, get_my_company_id() is
--    null, so the scan ran for every company and returned the new rows.
-- 3. RLS checked each row's own company_id, not the company of the rows it
--    points at, so a member could reference another company's vehicle,
--    expense, report or profile by id (for example, assign another
--    company's user as driver and have reminders emailed to them).
--    Composite foreign keys now require references to stay in-company.
-- 4. Writes can no longer forge who uploaded or reported something, and a
--    new damage report always starts as "reported".
-- 5. Indexes for the company_id filters RLS adds to every query, and size
--    and type limits on the storage buckets.

-- 1. Profiles ---------------------------------------------------------------

-- Sessions without a user (service role, SQL editor) are trusted operators
-- and may still change anything.
create or replace function public.enforce_profile_change_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.company_id <> old.company_id then
    raise exception 'A member can''t be moved to another company';
  end if;

  if new.role <> old.role then
    if public.get_my_role() is distinct from 'admin'
      or old.company_id is distinct from public.get_my_company_id()
      or old.id = auth.uid()
    then
      raise exception 'Only an admin can change another member''s role';
    end if;
  end if;

  return new;
end;
$$;

-- Role changes go through update_member_role() (security definer), so
-- clients only ever need to edit their own name.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Recipients only mark notifications read; the cron route (service role)
-- sets email_sent_at.
revoke update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;

-- 2. Reminder scan ----------------------------------------------------------

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

revoke execute on function public.generate_due_reminders() from public, anon;
grant execute on function public.generate_due_reminders() to authenticated, service_role;

-- 3. In-company references --------------------------------------------------

-- Targets for the composite keys below.
alter table public.vehicles
  add constraint vehicles_id_company_id_key unique (id, company_id);
alter table public.profiles
  add constraint profiles_id_company_id_key unique (id, company_id);
alter table public.expenses
  add constraint expenses_id_company_id_key unique (id, company_id);
alter table public.damage_reports
  add constraint damage_reports_id_company_id_key unique (id, company_id);

-- Each one sits next to the existing single-column key and keeps its
-- delete behaviour. "set null (column)" clears only the reference, never
-- company_id. A null reference is not checked (MATCH SIMPLE).

alter table public.vehicle_documents
  add constraint vehicle_documents_vehicle_company_fkey
    foreign key (vehicle_id, company_id)
    references public.vehicles (id, company_id) on delete cascade,
  add constraint vehicle_documents_uploaded_by_company_fkey
    foreign key (uploaded_by, company_id)
    references public.profiles (id, company_id) on delete set null (uploaded_by);

alter table public.vehicles
  add constraint vehicles_assigned_driver_company_fkey
    foreign key (assigned_driver_id, company_id)
    references public.profiles (id, company_id) on delete set null (assigned_driver_id),
  add constraint vehicles_created_by_company_fkey
    foreign key (created_by, company_id)
    references public.profiles (id, company_id) on delete set null (created_by);

alter table public.maintenance_records
  add constraint maintenance_records_vehicle_company_fkey
    foreign key (vehicle_id, company_id)
    references public.vehicles (id, company_id) on delete cascade,
  add constraint maintenance_records_performed_by_company_fkey
    foreign key (performed_by, company_id)
    references public.profiles (id, company_id) on delete set null (performed_by),
  add constraint maintenance_records_created_by_company_fkey
    foreign key (created_by, company_id)
    references public.profiles (id, company_id) on delete set null (created_by);

alter table public.expenses
  add constraint expenses_vehicle_company_fkey
    foreign key (vehicle_id, company_id)
    references public.vehicles (id, company_id) on delete set null (vehicle_id),
  add constraint expenses_created_by_company_fkey
    foreign key (created_by, company_id)
    references public.profiles (id, company_id) on delete set null (created_by);

alter table public.damage_reports
  add constraint damage_reports_vehicle_company_fkey
    foreign key (vehicle_id, company_id)
    references public.vehicles (id, company_id) on delete cascade,
  add constraint damage_reports_expense_company_fkey
    foreign key (expense_id, company_id)
    references public.expenses (id, company_id) on delete set null (expense_id),
  add constraint damage_reports_reported_by_company_fkey
    foreign key (reported_by, company_id)
    references public.profiles (id, company_id) on delete set null (reported_by);

alter table public.damage_report_photos
  add constraint damage_report_photos_report_company_fkey
    foreign key (damage_report_id, company_id)
    references public.damage_reports (id, company_id) on delete cascade,
  add constraint damage_report_photos_uploaded_by_company_fkey
    foreign key (uploaded_by, company_id)
    references public.profiles (id, company_id) on delete set null (uploaded_by);

alter table public.notifications
  add constraint notifications_vehicle_company_fkey
    foreign key (vehicle_id, company_id)
    references public.vehicles (id, company_id) on delete cascade,
  add constraint notifications_recipient_company_fkey
    foreign key (recipient_id, company_id)
    references public.profiles (id, company_id) on delete cascade;

alter table public.company_invitations
  add constraint company_invitations_invited_by_company_fkey
    foreign key (invited_by, company_id)
    references public.profiles (id, company_id) on delete set null (invited_by);

-- 4. Who did it -------------------------------------------------------------

drop policy "Admins and fleet managers can add vehicle documents"
  on public.vehicle_documents;
create policy "Admins and fleet managers can add vehicle documents"
  on public.vehicle_documents for insert
  with check (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
    and uploaded_by = auth.uid()
  );

-- Drivers report damage; triage (status, linked expense) stays with the
-- roles that may update reports.
drop policy "Members can report damage" on public.damage_reports;
create policy "Members can report damage"
  on public.damage_reports for insert
  with check (
    company_id = public.get_my_company_id()
    and reported_by = auth.uid()
    and status = 'reported'
    and expense_id is null
    and resolved_at is null
  );

drop policy "Members can attach photos to damage reports"
  on public.damage_report_photos;
create policy "Members can attach photos to damage reports"
  on public.damage_report_photos for insert
  with check (
    company_id = public.get_my_company_id()
    and uploaded_by = auth.uid()
  );

-- 5. Indexes and storage limits ---------------------------------------------

create index vehicle_documents_company_id_idx
  on public.vehicle_documents (company_id);
create index damage_report_photos_company_id_idx
  on public.damage_report_photos (company_id);
-- notifications(vehicle_id) is already covered: notifications_reminder_key
-- starts with it.

-- Uploads go straight from the browser to Storage, so these limits are the
-- only ones that apply.
update storage.buckets
set file_size_limit = 20 * 1024 * 1024
where id = 'vehicle-documents';

update storage.buckets
set file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = array['image/*']
where id = 'damage-reports';
