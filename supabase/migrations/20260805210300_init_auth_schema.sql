-- Phase 2: multi-tenant foundation — companies, profiles, roles, RLS.
--
-- A company is a tenant. Every user belongs to exactly one company via
-- profiles.company_id. The first user to sign up for a company becomes its
-- admin (see handle_new_user below); inviting further team members is a
-- later phase.

create type public.user_role as enum ('admin', 'fleet_manager', 'mechanic', 'driver');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'driver',
  created_at timestamptz not null default now()
);

create index profiles_company_id_idx on public.profiles (company_id);

alter table public.companies enable row level security;
alter table public.profiles enable row level security;

-- Helper functions run as security definer so RLS policies can look up the
-- caller's own company/role without recursively re-evaluating RLS on
-- profiles (which would otherwise error with "infinite recursion detected
-- in policy").

create function public.get_my_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create function public.get_my_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "Members can view their own company"
  on public.companies for select
  using (id = public.get_my_company_id());

create policy "Admins can update their own company"
  on public.companies for update
  using (id = public.get_my_company_id() and public.get_my_role() = 'admin');

create policy "Members can view profiles in their company"
  on public.profiles for select
  using (company_id = public.get_my_company_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Prevent a user from granting themselves a higher role or moving
-- themselves to a different company via the "update own profile" policy
-- above — only an admin may change role/company_id, and only for members
-- of their own company.
create function public.enforce_profile_change_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role <> old.role or new.company_id <> old.company_id) then
    if public.get_my_role() <> 'admin' or old.company_id <> public.get_my_company_id() then
      raise exception 'Only an admin can change role or company assignment';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_profile_change_permission
  before update on public.profiles
  for each row execute function public.enforce_profile_change_permission();

-- New signups create their own company and become its admin. Metadata is
-- supplied by the client at sign-up time (see /signup).
create function public.handle_new_user()
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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
