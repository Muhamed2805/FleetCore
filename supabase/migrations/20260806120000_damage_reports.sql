-- Phase 10: damage reports.
--
-- Any company member (including drivers) can report damage on a vehicle
-- with a photo and description — a driver is usually the one holding the
-- vehicle when damage happens, so reporting isn't restricted to
-- admin/fleet_manager like most other writes in this schema. Triaging the
-- report (status/severity changes, linking it to a repair expense,
-- deleting) stays restricted to admin/fleet_manager/mechanic, same as
-- maintenance_records.

create type public.damage_severity as enum ('minor', 'moderate', 'severe');
create type public.damage_report_status as enum ('reported', 'in_repair', 'resolved');

create table public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  severity public.damage_severity not null default 'minor',
  status public.damage_report_status not null default 'reported',
  description text,
  expense_id uuid references public.expenses (id) on delete set null,
  reported_by uuid references public.profiles (id) on delete set null,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index damage_reports_company_id_idx on public.damage_reports (company_id);
create index damage_reports_vehicle_id_idx on public.damage_reports (vehicle_id);

create table public.damage_report_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  damage_report_id uuid not null references public.damage_reports (id) on delete cascade,
  file_path text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index damage_report_photos_report_id_idx on public.damage_report_photos (damage_report_id);

alter table public.damage_reports enable row level security;
alter table public.damage_report_photos enable row level security;

create trigger damage_reports_set_updated_at
  before update on public.damage_reports
  for each row execute function public.set_updated_at();

create policy "Members can view their company's damage reports"
  on public.damage_reports for select
  using (company_id = public.get_my_company_id());

create policy "Members can report damage"
  on public.damage_reports for insert
  with check (company_id = public.get_my_company_id());

create policy "Admins, fleet managers and mechanics can update damage reports"
  on public.damage_reports for update
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );

create policy "Admins, fleet managers and mechanics can delete damage reports"
  on public.damage_reports for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );

create policy "Members can view their company's damage report photos"
  on public.damage_report_photos for select
  using (company_id = public.get_my_company_id());

create policy "Members can attach photos to damage reports"
  on public.damage_report_photos for insert
  with check (company_id = public.get_my_company_id());

create policy "Admins, fleet managers and mechanics can delete damage report photos"
  on public.damage_report_photos for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );

-- Storage: one private bucket, objects keyed as "{company_id}/{damage_report_id}/{filename}".
insert into storage.buckets (id, name, public)
values ('damage-reports', 'damage-reports', false);

create policy "Members can read their company's damage report files"
  on storage.objects for select
  using (
    bucket_id = 'damage-reports'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

create policy "Members can upload damage report files"
  on storage.objects for insert
  with check (
    bucket_id = 'damage-reports'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

create policy "Admins, fleet managers and mechanics can delete damage report files"
  on storage.objects for delete
  using (
    bucket_id = 'damage-reports'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );
