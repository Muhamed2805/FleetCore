-- Evaluate the RLS helpers once per query instead of once per row.
--
-- get_my_company_id() and get_my_role() are security definer functions with
-- their own search_path, so Postgres can't inline them: a bare call in a
-- policy runs (and looks up the caller's profile) for every row the query
-- touches. Wrapped in a scalar subquery, "(select fn())", the planner runs
-- it once as an InitPlan and reuses the value. The same applies to
-- auth.uid(). The rules themselves don't change.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- companies -------------------------------------------------------------------

alter policy "Members can view their own company"
  on public.companies
  using (id = (select public.get_my_company_id()));

alter policy "Admins can update their own company"
  on public.companies
  using (
    id = (select public.get_my_company_id())
    and (select public.get_my_role()) = 'admin'
  );

-- profiles --------------------------------------------------------------------

alter policy "Members can view profiles in their company"
  on public.profiles
  using (company_id = (select public.get_my_company_id()));

alter policy "Users can update their own profile"
  on public.profiles
  using (id = (select auth.uid()));

-- vehicles --------------------------------------------------------------------

alter policy "Members can view their company's vehicles"
  on public.vehicles
  using (company_id = (select public.get_my_company_id()));

alter policy "Admins and fleet managers can add vehicles"
  on public.vehicles
  with check (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

alter policy "Admins and fleet managers can update vehicles"
  on public.vehicles
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

alter policy "Admins and fleet managers can delete vehicles"
  on public.vehicles
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

-- vehicle_documents -----------------------------------------------------------

alter policy "Members can view their company's vehicle documents"
  on public.vehicle_documents
  using (company_id = (select public.get_my_company_id()));

alter policy "Admins and fleet managers can add vehicle documents"
  on public.vehicle_documents
  with check (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
    and uploaded_by = (select auth.uid())
  );

alter policy "Admins and fleet managers can delete vehicle documents"
  on public.vehicle_documents
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

-- reminder_settings -----------------------------------------------------------

alter policy "Members can view their company's reminder settings"
  on public.reminder_settings
  using (company_id = (select public.get_my_company_id()));

alter policy "Admins can update their company's reminder settings"
  on public.reminder_settings
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) = 'admin'
  );

-- notifications ---------------------------------------------------------------

alter policy "Users can view their own notifications"
  on public.notifications
  using (recipient_id = (select auth.uid()));

alter policy "Users can update their own notifications"
  on public.notifications
  using (recipient_id = (select auth.uid()));

-- maintenance_records ---------------------------------------------------------

alter policy "Members can view their company's maintenance records"
  on public.maintenance_records
  using (company_id = (select public.get_my_company_id()));

alter policy "Admins, fleet managers and mechanics can add maintenance records"
  on public.maintenance_records
  with check (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

alter policy "Admins, fleet managers and mechanics can update maintenance records"
  on public.maintenance_records
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

alter policy "Admins, fleet managers and mechanics can delete maintenance records"
  on public.maintenance_records
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

-- expenses --------------------------------------------------------------------

alter policy "Members can view their company's expenses"
  on public.expenses
  using (company_id = (select public.get_my_company_id()));

alter policy "Admins and fleet managers can add expenses"
  on public.expenses
  with check (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

alter policy "Admins and fleet managers can update expenses"
  on public.expenses
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

alter policy "Admins and fleet managers can delete expenses"
  on public.expenses
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

-- damage_reports --------------------------------------------------------------

alter policy "Members can view their company's damage reports"
  on public.damage_reports
  using (company_id = (select public.get_my_company_id()));

alter policy "Members can report damage"
  on public.damage_reports
  with check (
    company_id = (select public.get_my_company_id())
    and reported_by = (select auth.uid())
    and status = 'reported'
    and expense_id is null
    and resolved_at is null
  );

alter policy "Admins, fleet managers and mechanics can update damage reports"
  on public.damage_reports
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

alter policy "Admins, fleet managers and mechanics can delete damage reports"
  on public.damage_reports
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

-- damage_report_photos --------------------------------------------------------

alter policy "Members can view their company's damage report photos"
  on public.damage_report_photos
  using (company_id = (select public.get_my_company_id()));

alter policy "Members can attach photos to damage reports"
  on public.damage_report_photos
  with check (
    company_id = (select public.get_my_company_id())
    and uploaded_by = (select auth.uid())
  );

alter policy "Admins, fleet managers and mechanics can delete damage report photos"
  on public.damage_report_photos
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

-- company_invitations ---------------------------------------------------------

alter policy "Admins can view their company's invitations"
  on public.company_invitations
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) = 'admin'
  );

alter policy "Admins can create invitations"
  on public.company_invitations
  with check (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) = 'admin'
    and invited_by = (select auth.uid())
    and accepted_at is null
  );

alter policy "Admins can update their company's invitations"
  on public.company_invitations
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) = 'admin'
  )
  with check (
    company_id = (select public.get_my_company_id())
    and accepted_at is null
  );

alter policy "Admins can delete their company's invitations"
  on public.company_invitations
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) = 'admin'
  );

-- storage.objects -------------------------------------------------------------

alter policy "Members can read their company's vehicle document files"
  on storage.objects
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = (select public.get_my_company_id())::text
  );

alter policy "Admins and fleet managers can upload vehicle document files"
  on storage.objects
  with check (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = (select public.get_my_company_id())::text
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

alter policy "Admins and fleet managers can delete vehicle document files"
  on storage.objects
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = (select public.get_my_company_id())::text
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

alter policy "Members can read their company's damage report files"
  on storage.objects
  using (
    bucket_id = 'damage-reports'
    and (storage.foldername(name))[1] = (select public.get_my_company_id())::text
  );

alter policy "Members can upload damage report files"
  on storage.objects
  with check (
    bucket_id = 'damage-reports'
    and (storage.foldername(name))[1] = (select public.get_my_company_id())::text
  );

alter policy "Admins, fleet managers and mechanics can delete damage report files"
  on storage.objects
  using (
    bucket_id = 'damage-reports'
    and (storage.foldername(name))[1] = (select public.get_my_company_id())::text
    and (select public.get_my_role()) in ('admin', 'fleet_manager', 'mechanic')
  );

-- Guard ------------------------------------------------------------------------

-- Fails the migration if any policy on our tables or buckets still calls a
-- helper without the wrapping select, e.g. one added from the dashboard.
-- Postgres prints a wrapped call as "( SELECT get_my_role() AS ...)".
do $$
declare
  unwrapped text;
begin
  select string_agg(format('%I.%I: %s', schemaname, tablename, policyname), ', ')
  into unwrapped
  from (
    select schemaname, tablename, policyname,
      coalesce(qual, '') || ' ' || coalesce(with_check, '') as expr
    from pg_policies
    where schemaname = 'public'
      or (schemaname = 'storage'
        and (policyname like '%vehicle document files'
          or policyname like '%damage report files'))
  ) p
  where regexp_count(expr, '(get_my_company_id|get_my_role|auth\.uid)\(\)')
    <> regexp_count(expr, 'SELECT (public\.)?(get_my_company_id|get_my_role|auth\.uid)\(\)');

  if unwrapped is not null then
    raise exception 'RLS policies still call helpers per row: %', unwrapped;
  end if;
end;
$$;
