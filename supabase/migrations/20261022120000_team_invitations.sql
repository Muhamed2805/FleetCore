-- Phase 12: team — invite members into an existing company, change their
-- role, and remove them.
--
-- An admin invites someone by email with a role. The invitee opens the
-- invite link (/invite/<token>) and creates an account with that exact
-- email; handle_new_user() sees the invite_token in the signup metadata
-- and adds the new user to the inviting company with the invited role
-- instead of creating a new company. Invitations are for new accounts
-- only — a user belongs to exactly one company, and moving an existing
-- account between companies is out of scope.
--
-- Role changes and removals go through security-definer functions rather
-- than an RLS update/delete policy on profiles, so the guard rails (admins
-- only, same company, never yourself — which also guarantees a company
-- always keeps at least one admin) live in one place.

create table public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null check (email = lower(email)),
  role public.user_role not null default 'driver',
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz
);

create index company_invitations_company_id_idx
  on public.company_invitations (company_id);

-- At most one open invitation per email per company. Re-inviting replaces
-- the old one (the app deletes it first).
create unique index company_invitations_open_email_idx
  on public.company_invitations (company_id, email)
  where accepted_at is null;

alter table public.company_invitations enable row level security;

create policy "Admins can view their company's invitations"
  on public.company_invitations for select
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() = 'admin'
  );

create policy "Admins can create invitations"
  on public.company_invitations for insert
  with check (
    company_id = public.get_my_company_id()
    and public.get_my_role() = 'admin'
    and invited_by = auth.uid()
    and accepted_at is null
  );

create policy "Admins can update their company's invitations"
  on public.company_invitations for update
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() = 'admin'
  )
  with check (
    company_id = public.get_my_company_id()
    and accepted_at is null
  );

create policy "Admins can delete their company's invitations"
  on public.company_invitations for delete
  using (
    company_id = public.get_my_company_id()
    and public.get_my_role() = 'admin'
  );

-- Public lookup for the invite page. The token is the secret: whoever holds
-- it may see which company invited which email, and nothing else.
create function public.get_invitation(invite_token uuid)
returns table (
  email text,
  role public.user_role,
  company_name text,
  expires_at timestamptz,
  accepted boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select i.email, i.role, c.name, i.expires_at, i.accepted_at is not null
  from public.company_invitations i
  join public.companies c on c.id = i.company_id
  where i.token = invite_token;
$$;

revoke execute on function public.get_invitation(uuid) from public;
grant execute on function public.get_invitation(uuid) to anon, authenticated;

-- Members of the caller's company with their login email. Emails live in
-- auth.users, which RLS-scoped clients can't read.
create function public.get_team_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.full_name, u.email::text, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.company_id = public.get_my_company_id()
  order by p.created_at;
$$;

revoke execute on function public.get_team_members() from public, anon;
grant execute on function public.get_team_members() to authenticated;

create function public.update_member_role(member_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() is distinct from 'admin' then
    raise exception 'Only an admin can change roles';
  end if;

  if member_id = auth.uid() then
    raise exception 'You can''t change your own role';
  end if;

  update public.profiles
  set role = new_role
  where id = member_id
    and company_id = public.get_my_company_id();

  if not found then
    raise exception 'Member not found';
  end if;
end;
$$;

revoke execute on function public.update_member_role(uuid, public.user_role) from public, anon;
grant execute on function public.update_member_role(uuid, public.user_role) to authenticated;

-- Removing a member deletes their account: a user belongs to exactly one
-- company, so a profile-less account could no longer use the app. Their
-- records stay — every reference to profiles is "on delete set null"
-- (created_by, reported_by, assigned_driver_id, ...) except their own
-- notifications, which cascade.
create function public.remove_member(member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() is distinct from 'admin' then
    raise exception 'Only an admin can remove members';
  end if;

  if member_id = auth.uid() then
    raise exception 'You can''t remove yourself';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = member_id
      and company_id = public.get_my_company_id()
  ) then
    raise exception 'Member not found';
  end if;

  delete from auth.users where id = member_id;
end;
$$;

revoke execute on function public.remove_member(uuid) from public, anon;
grant execute on function public.remove_member(uuid) to authenticated;

-- New signups: with a valid invite_token in the metadata, join the
-- inviting company with the invited role; without one, create a new
-- company and become its admin (unchanged from Phase 5).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  invite_token_text text := new.raw_user_meta_data ->> 'invite_token';
  invite public.company_invitations%rowtype;
begin
  if invite_token_text is not null then
    if invite_token_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select * into invite
      from public.company_invitations
      where token = invite_token_text::uuid
        and accepted_at is null
        and expires_at > now()
        and email = lower(new.email)
      for update;
    end if;

    if invite.id is null then
      raise exception 'Invitation is invalid, expired, or for a different email';
    end if;

    insert into public.profiles (id, company_id, full_name, role)
    values (
      new.id,
      invite.company_id,
      new.raw_user_meta_data ->> 'full_name',
      invite.role
    );

    update public.company_invitations
    set accepted_at = now()
    where id = invite.id;

    return new;
  end if;

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
