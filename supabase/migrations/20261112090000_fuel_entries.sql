-- Phase 18: fuel log and odometer.
--
-- Each row is one fill-up: date, odometer reading, liters, total cost and
-- whether the tank was filled up. Fuel consumption (l/100 km) is worked out
-- in the app from consecutive full-tank fill-ups.
--
-- A fill-up is also a fuel expense, so every row owns a linked expense row
-- that the trigger below creates, keeps in sync and deletes. Expense totals
-- and the overview then include fuel without counting it twice, and drivers
-- can log fuel although they may not write expenses themselves. The same
-- trigger raises the vehicle's odometer when a fill-up reads higher.

create table public.fuel_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  filled_on date not null default current_date,
  odometer integer not null check (odometer >= 0),
  liters numeric(8, 2) not null check (liters > 0),
  total_cost numeric(10, 2) not null check (total_cost >= 0),
  full_tank boolean not null default true,
  station text,
  notes text,
  -- Set by the trigger; whatever a client sends is ignored.
  expense_id uuid references public.expenses (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- References stay inside the company, like every other table.
  constraint fuel_entries_vehicle_company_fkey
    foreign key (vehicle_id, company_id)
    references public.vehicles (id, company_id) on delete cascade,
  constraint fuel_entries_expense_company_fkey
    foreign key (expense_id, company_id)
    references public.expenses (id, company_id) on delete set null (expense_id),
  constraint fuel_entries_created_by_company_fkey
    foreign key (created_by, company_id)
    references public.profiles (id, company_id) on delete set null (created_by)
);

create index fuel_entries_company_id_idx on public.fuel_entries (company_id);
-- Consumption is worked out per vehicle in odometer order.
create index fuel_entries_vehicle_odometer_idx on public.fuel_entries (vehicle_id, odometer);
create unique index fuel_entries_expense_id_key on public.fuel_entries (expense_id);

alter table public.fuel_entries enable row level security;

create trigger fuel_entries_set_updated_at
  before update on public.fuel_entries
  for each row execute function public.set_updated_at();

-- Policies ------------------------------------------------------------------

create policy "Members can view their company's fuel entries"
  on public.fuel_entries for select
  using (company_id = (select public.get_my_company_id()));

-- Admins and fleet managers log fuel for any vehicle, drivers only for the
-- vehicle assigned to them.
create policy "Managers and assigned drivers can add fuel entries"
  on public.fuel_entries for insert
  with check (
    company_id = (select public.get_my_company_id())
    and created_by = (select auth.uid())
    and (
      (select public.get_my_role()) in ('admin', 'fleet_manager')
      or exists (
        select 1 from public.vehicles v
        where v.id = vehicle_id
          and v.assigned_driver_id = (select auth.uid())
      )
    )
  );

create policy "Admins and fleet managers can update fuel entries"
  on public.fuel_entries for update
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  )
  with check (
    company_id = (select public.get_my_company_id())
  );

create policy "Admins and fleet managers can delete fuel entries"
  on public.fuel_entries for delete
  using (
    company_id = (select public.get_my_company_id())
    and (select public.get_my_role()) in ('admin', 'fleet_manager')
  );

-- Linked expense and odometer -------------------------------------------------

-- Security definer: drivers may add fill-ups but not expenses, and nobody
-- but admins and fleet managers may update vehicles. The policies above
-- have already decided whether this row may be written.
create or replace function public.sync_fuel_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expense_description text;
begin
  if tg_op = 'DELETE' then
    -- When the vehicle is gone, this is the cascade from deleting it.
    -- Expenses outlive their vehicle (vehicle_id is set null), so the fuel
    -- cost stays in the expense history.
    if exists (select 1 from public.vehicles where id = old.vehicle_id) then
      delete from public.expenses where id = old.expense_id;
    end if;
    return old;
  end if;

  -- Locale-neutral, since the database doesn't know the reader's language.
  expense_description := trim(to_char(new.liters, 'FM999999990.00')) || ' L';

  if tg_op = 'INSERT' then
    insert into public.expenses (company_id, vehicle_id, category, amount, expense_date, description, created_by)
    values (new.company_id, new.vehicle_id, 'fuel', new.total_cost, new.filled_on, expense_description, new.created_by)
    returning id into new.expense_id;
  else
    -- The link can't be moved by a client. It only changes when the foreign
    -- key clears it because the expense was deleted on its own; the
    -- fill-up then simply stays without one.
    if exists (select 1 from public.expenses where id = old.expense_id) then
      new.expense_id := old.expense_id;
    else
      new.expense_id := null;
    end if;
    update public.expenses
    set vehicle_id = new.vehicle_id,
        amount = new.total_cost,
        expense_date = new.filled_on,
        description = expense_description
    where id = new.expense_id;
  end if;

  -- Only ever raised: an older fill-up entered later must not wind it back.
  update public.vehicles
  set odometer = new.odometer
  where id = new.vehicle_id
    and (odometer is null or odometer < new.odometer);

  return new;
end;
$$;

revoke execute on function public.sync_fuel_entry() from public, anon, authenticated;

create trigger fuel_entries_sync_insert_update
  before insert or update on public.fuel_entries
  for each row execute function public.sync_fuel_entry();

create trigger fuel_entries_sync_delete
  after delete on public.fuel_entries
  for each row execute function public.sync_fuel_entry();
