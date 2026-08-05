-- Phase 6: maintenance records (schedule + service history in one
-- lifecycle) and expense tracking.
--
-- A maintenance record starts life "scheduled" and is later marked
-- "completed" (or "cancelled") with the actual date, odometer and cost —
-- one row covers both the upcoming-schedule and the after-the-fact
-- service-history views, rather than duplicating the same data across two
-- tables.

create type public.maintenance_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
create type public.maintenance_type as enum ('oil_change', 'tire_rotation', 'brake_service', 'inspection', 'repair', 'other');
create type public.expense_category as enum ('fuel', 'toll', 'fine', 'parking', 'registration_fee', 'insurance_premium', 'other');

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type public.maintenance_type not null default 'other',
  status public.maintenance_status not null default 'scheduled',
  title text not null,
  description text,
  scheduled_date date,
  completed_date date,
  odometer integer,
  cost numeric(10, 2),
  performed_by uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_records_company_id_idx on public.maintenance_records (company_id);
create index maintenance_records_vehicle_id_idx on public.maintenance_records (vehicle_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  category public.expense_category not null default 'other',
  amount numeric(10, 2) not null,
  expense_date date not null default current_date,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index expenses_company_id_idx on public.expenses (company_id);
create index expenses_vehicle_id_idx on public.expenses (vehicle_id);

alter table public.maintenance_records enable row level security;
alter table public.expenses enable row level security;

create trigger maintenance_records_set_updated_at
  before update on public.maintenance_records
  for each row execute function public.set_updated_at();

create policy "Members can view their company's maintenance records"
  on public.maintenance_records for select
  using (company_id = public.get_my_company_id());

create policy "Admins, fleet managers and mechanics can add maintenance records"
  on public.maintenance_records for insert
  with check (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );

create policy "Admins, fleet managers and mechanics can update maintenance records"
  on public.maintenance_records for update
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );

create policy "Admins, fleet managers and mechanics can delete maintenance records"
  on public.maintenance_records for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager', 'mechanic')
  );

create policy "Members can view their company's expenses"
  on public.expenses for select
  using (company_id = public.get_my_company_id());

create policy "Admins and fleet managers can add expenses"
  on public.expenses for insert
  with check (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Admins and fleet managers can update expenses"
  on public.expenses for update
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );

create policy "Admins and fleet managers can delete expenses"
  on public.expenses for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() in ('admin', 'fleet_manager')
  );
