-- Account settings (Phase 16). Members rename themselves and admins rename
-- the company from the Settings page; clients can write these columns
-- directly (RLS decides who), so the database enforces the rules too.

-- 1. Admins change only the company name --------------------------------------

-- "Admins can update their own company" already limits who; this limits
-- what. Without it an admin could also rewrite companies.id or created_at.
revoke update on public.companies from anon, authenticated;
grant update (name) on public.companies to authenticated;

-- 2. Names are trimmed, non-empty and at most 100 characters ------------------

-- Bring existing rows in line first so the constraints can be added.
update public.companies
set name = coalesce(nullif(btrim(left(btrim(name), 100)), ''), 'My Company')
where name is distinct from coalesce(nullif(btrim(left(btrim(name), 100)), ''), 'My Company');

update public.profiles
set full_name = nullif(btrim(left(btrim(full_name), 100)), '')
where full_name is distinct from nullif(btrim(left(btrim(full_name), 100)), '');

alter table public.companies
  add constraint companies_name_check
  check (char_length(name) between 1 and 100 and name = btrim(name));

-- A missing name stays null (the UI falls back to the email address).
alter table public.profiles
  add constraint profiles_full_name_check
  check (full_name is null or (char_length(full_name) between 1 and 100 and full_name = btrim(full_name)));

-- 3. Signup cleans the names it is given --------------------------------------

-- The names come from signup metadata, which the client controls. Clean
-- them the same way so a blank or overlong name can't fail the signup on
-- the checks above. Otherwise unchanged from 20261022120000.
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
  clean_full_name text := nullif(btrim(left(btrim(new.raw_user_meta_data ->> 'full_name'), 100)), '');
  clean_company_name text := coalesce(
    nullif(btrim(left(btrim(new.raw_user_meta_data ->> 'company_name'), 100)), ''),
    'My Company'
  );
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
    values (new.id, invite.company_id, clean_full_name, invite.role);

    update public.company_invitations
    set accepted_at = now()
    where id = invite.id;

    return new;
  end if;

  insert into public.companies (name)
  values (clean_company_name)
  returning id into new_company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (new.id, new_company_id, clean_full_name, 'admin');

  insert into public.reminder_settings (company_id) values (new_company_id);

  return new;
end;
$$;
