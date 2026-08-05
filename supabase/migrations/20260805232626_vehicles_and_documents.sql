-- Phase 4: vehicles and their documents.
--
-- Vehicles are managed by admins and fleet managers; every company member
-- can view them. Registration/insurance/inspection expiry dates here are
-- the source of truth for reminders (a later phase).

create type public.vehicle_type as enum ('car', 'van', 'truck', 'construction_machinery', 'forklift');
create type public.vehicle_status as enum ('active', 'maintenance', 'inactive', 'sold');
create type public.document_category as enum ('registration', 'insurance', 'inspection', 'other');

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  type public.vehicle_type not null,
  status public.vehicle_status not null default 'active',
  make text not null,
  model text not null,
  year integer,
  license_plate text not null,
  vin text,
  assigned_driver_id uuid references public.profiles (id) on delete set null,
  odometer integer,
  registration_expiry date,
  insurance_expiry date,
  inspection_expiry date,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicles_company_id_idx on public.vehicles (company_id);
create index vehicles_assigned_driver_id_idx on public.vehicles (assigned_driver_id);

create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  category public.document_category not null default 'other',
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index vehicle_documents_vehicle_id_idx on public.vehicle_documents (vehicle_id);

alter table public.vehicles enable row level security;
alter table public.vehicle_documents enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create policy "Members can view their company's vehicles"
  on public.vehicles for select
  using (company_id = public.get_my_company_id());

create policy "Admins and fleet managers can add vehicles"
  on public.vehicles for insert
  with check (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Admins and fleet managers can update vehicles"
  on public.vehicles for update
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Admins and fleet managers can delete vehicles"
  on public.vehicles for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Members can view their company's vehicle documents"
  on public.vehicle_documents for select
  using (company_id = public.get_my_company_id());

create policy "Admins and fleet managers can add vehicle documents"
  on public.vehicle_documents for insert
  with check (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Admins and fleet managers can delete vehicle documents"
  on public.vehicle_documents for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

-- Storage: one private bucket, objects keyed as "{company_id}/{vehicle_id}/{filename}".
insert into storage.buckets (id, name, public)
values ('vehicle-documents', 'vehicle-documents', false);

create policy "Members can read their company's vehicle document files"
  on storage.objects for select
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

create policy "Admins and fleet managers can upload vehicle document files"
  on storage.objects for insert
  with check (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Admins and fleet managers can delete vehicle document files"
  on storage.objects for delete
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
    and public.get_my_role() in ('admin', 'fleet_manager')
  );
