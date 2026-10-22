# FleetCore

[![CI](https://github.com/Muhamed2805/FleetCore/actions/workflows/ci.yml/badge.svg)](https://github.com/Muhamed2805/FleetCore/actions/workflows/ci.yml)

Modern SaaS fleet management & maintenance platform for companies operating
cars, vans, trucks, construction machinery and forklifts. Vehicles,
registrations, insurance, inspections, maintenance schedules, service
history, expenses and documents from one dashboard, with role-based access
and expiration reminders.

Built to a premium bar (Linear / Notion / Stripe Dashboard-grade UI),
responsive with dark/light mode, on Supabase (auth, database, storage).

## Status

The project is being built incrementally, phase by phase. See progress in
commit history.

- [x] Phase 1 — Scaffold (Next.js, Tailwind, shadcn/ui, dark/light mode)
- [x] Phase 2 — Supabase (auth, schema, RLS, role-based access)
- [x] Phase 3 — Dashboard shell (layout, sidebar, navigation)
- [x] Phase 4 — Vehicles CRUD + document uploads
- [x] Phase 5 — Reminders (email + in-app, customizable thresholds)
- [x] Phase 6 — Maintenance, service history, expense tracking
- [x] Phase 7 — KPI dashboard, charts, calendar view, advanced search
- [x] Phase 8 — AI-powered data extraction from documents
- [x] Phase 9 — Polish, responsive, accessibility (deploy prep TBD)
- [x] Phase 10 — Damage reports (photos, severity/status workflow, linked repair expenses)
- [x] Phase 11 — Internationalization (en, bs, hr, sr, de, sv, nl)
- [x] Phase 12 — Team (email invitations, role changes, member removal)
- [x] Phase 13 — CI (lint, typecheck and build on every pull request)
- [x] Phase 14 — Playwright smoke tests in CI
- [x] Phase 15 — Documents (company-wide list, missing documents, AI expiry scan)
- [x] Phase 16 — Account & settings (password reset, profile, password and company name)
- [x] Phase 17 — CSV export (vehicles, maintenance, expenses)

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) (Auth, Postgres, Storage)
- [next-themes](https://github.com/pacocoursey/next-themes) for dark/light mode

## Getting started

1. Create a [Supabase](https://supabase.com) project.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon
   key from Project Settings > API.
3. Apply the database schema: link the project with the Supabase CLI
   (`npx supabase link --project-ref <ref>`) then run
   `npx supabase db push`, or paste the contents of
   `supabase/migrations/*.sql` into the SQL editor in the dashboard.
4. In Authentication > URL Configuration, set the Site URL to the app's
   URL. Email links (signup confirmation, password reset) return through
   `/auth/callback`, which Supabase allows on the Site URL's host; for any
   other host (for example preview deployments) add `https://<host>/**`
   to the Redirect URLs.
5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Checks

CI (`.github/workflows/ci.yml`) runs on every pull request and every push
to `main`, on the Node version in `.nvmrc`, as three parallel jobs:

- **Lint, typecheck & build**
- **Migrations & database types** — applies every migration to a
  throwaway Postgres and fails if `src/lib/supabase/database.types.ts`
  doesn't match them (see Database types below).
- **E2E smoke tests** — Playwright (`e2e/`) against the production build:
  public pages in every locale, the login redirect for protected pages,
  the invite page, and the `/auth` and `/api` route handlers. They need no
  session, so CI runs them against a placeholder Supabase URL with no
  secrets.

Run the same locally before opening a PR:

```bash
npm run lint
npm run typecheck
npm run build
npx playwright install chromium   # first time only
npm run test:e2e                  # reuses a running `npm run dev`, or starts one
npm run db:types                  # after changing migrations; needs Docker
```

### Database types

`src/lib/supabase/database.types.ts` is generated from the migrations, never
edited by hand. `npm run db:types` (`scripts/db-types.mjs`) starts a
throwaway Postgres 17 container, adds the few Supabase pieces the migrations
expect (`scripts/supabase-stub.sql`), applies every migration in order and
runs the Supabase CLI generator against it. It needs Docker but no Supabase
login, and a migration that fails to apply fails the run.

After adding a migration: run `npm run db:types` and commit the regenerated
file with it. `src/lib/supabase/types.ts` re-exports `Database` and gives
the enums their app-facing names (`UserRole`, `VehicleStatus`, …).

### Roles

Every signup creates a new company and its first user as `admin`. Roles are
`admin`, `fleet_manager`, `mechanic`, `driver` (see
`supabase/migrations/20260805210300_init_auth_schema.sql`). Admins bring
teammates into the company from the Team page (below).

### Tenant isolation

Each company is a tenant, and the database enforces the boundary, not the
UI:

- Row Level Security on every table scopes reads and writes to the
  caller's company (`get_my_company_id()`) and role (`get_my_role()`).
- Composite foreign keys (`(vehicle_id, company_id)` and so on) stop a row
  from pointing at another company's vehicle, expense, report or member.
- `company_id` on a profile never changes for a signed-in user, and users
  can only edit their own `full_name`; role changes and removals go
  through `update_member_role()` and `remove_member()`.
- Storage keys start with the company id, which the bucket policies check.
- Server Actions re-check the session and role, since anyone can POST to
  them. The service-role key is only used by the cron route.

See `supabase/migrations/20261023090000_tenant_isolation_hardening.sql`.

Policies call the helpers wrapped in a subquery,
`(select public.get_my_company_id())`, `(select auth.uid())`, so Postgres
runs them once per query instead of once per row. New policies must do the
same (`supabase/migrations/20261023100000_rls_initplan.sql`).

### Team

Admins invite people by email with a role from the Team page. The invitee
opens the link (`/invite/<token>`, valid 7 days) and creates an account with
that email; the signup trigger adds them to the inviting company with the
invited role instead of creating a new company. Invitations are for new
accounts only — a user belongs to exactly one company. Invite emails go out
via Resend; without `RESEND_API_KEY` nothing is sent and the admin gets a
link to copy and share instead. Invite links are built from `SITE_URL`;
set it in every deployment, since without it they fall back to the
request's Host header.

Admins can change any other member's role and remove members (which deletes
their account; records they created stay, with the author cleared). Admins
can't change their own role or remove themselves, so a company always keeps
at least one admin.

### Account

Everyone manages their own account from Settings (`/dashboard/settings`):
their name and their password. Admins also rename the company there. The
database enforces the same rules as the forms: names are trimmed and 1–100
characters (check constraints, which the signup trigger respects too),
members can only update their own `full_name`, and admins can only update
the company's `name` (column grant). See
`supabase/migrations/20261023130000_account_settings.sql`.

Changing the password in Settings asks for the current one first. A
forgotten password is reset by email:

1. `/forgot-password` asks Supabase Auth to send a reset link. The page
   answers the same way whether or not the account exists.
2. The link signs the user in through `/auth/callback`, which marks the
   session as a password recovery for 15 minutes (an httpOnly cookie).
3. `/reset-password` then lets them choose a new password without the old
   one. Without that mark it sends signed-in users to Settings and
   everyone else to request a new link.

The link must be opened in the browser that requested it (Supabase uses
PKCE). An expired, reused or foreign link lands on the login page with an
explanation. Optionally, turn on "Secure password change" in Supabase Auth
so Supabase itself requires a recent sign-in before a password change; both
flows above sign in first, so they keep working.

### AI document extraction

The "Scan registration document" / "Scan receipt or invoice" buttons on the
Add Vehicle and Add Expense forms send an uploaded image or PDF to Claude
(structured outputs, so the response always matches the expected schema) and
prefill the form. Requires `ANTHROPIC_API_KEY`; without it the button shows
a clear "not configured" message instead of failing silently.

Scans run as Server Actions, so only signed-in members can trigger them (each
scan spends API credits). Files are capped at 4 MB, set in
`src/lib/document-scan.ts`, to stay under the Server Action body limit in
`next.config.ts` and Vercel's 4.5 MB request limit.

Scans are rate limited in the database: at most 30 per user per hour and
200 per company per day (`consume_ai_scan()` in
`supabase/migrations/20261023110000_ai_scan_rate_limit.sql`). Each scan is
counted before the API call, so failed scans count too.

### Documents

The Documents page lists every vehicle document in the company, with search
(file name, vehicle or plate) and category/vehicle filters. Admins and fleet
managers upload from there or from a vehicle's page. For registration,
insurance and inspection documents, the upload dialog has a "Valid until"
date, prefilled from the vehicle. Changing it updates the vehicle's expiry,
which reminders and the calendar read. "Read with AI" fills that date from
the document, picks the vehicle by its plate when none is selected, and warns
when the plate doesn't match. Only the newest document per vehicle and
category shows the expiry; older ones are marked as replaced. A "Missing
documents" card lists vehicles (not sold) that have an expiry date on file
but no matching document.

### Export

The Vehicles, Maintenance and Expenses pages have an "Export CSV" button. It
downloads the rows that match the filters set on the page, from
`/dashboard/export/<dataset>` (`vehicles`, `maintenance` or `expenses`).
Any member can export what they can already see: the route reads as the
signed-in user, so RLS keeps it to their company.

The file is made for spreadsheets, Excel first:

- UTF-8 with a byte order mark, so letters like č, ž and ö show correctly.
- The interface language sets the delimiter and the decimal separator. In
  English it's `,` and `1234.50`. In the other languages it's `;` and
  `1234,50`, which is what Excel expects with those regional settings.
- Dates are `YYYY-MM-DD`. Amounts have two decimals and no thousands
  separator. The column header names the currency.
- Text that starts like a formula (`=`, `+`, `-`, `@`) gets a leading `'`, so
  a vehicle note can't run as a formula when the file is opened (CSV
  injection).

Rows are read 1000 at a time, the most Supabase returns per request, so an
export has every matching row. The list pages themselves load at most 1000
rows.

### Damage reports

Any company member — including drivers, who are usually the ones holding the
vehicle when damage happens — can log a damage report with photos and a
severity level from the vehicle page or the Damage reports section.
Admins, fleet managers and mechanics can then update its status
(reported → in repair → resolved) and link it to a repair expense with one
click, so the photo, the cost and the vehicle's history stay connected.

### Reminders

Each company has customizable day-thresholds (default 30/15/7/1) that
trigger an in-app notification, and optionally an email, before a
vehicle's registration/insurance/inspection expires. `POST
/api/reminders/cron` (with `Authorization: Bearer $CRON_SECRET`) scans
every company and is meant to be hit by a scheduler once deployed (Phase
9); until then, trigger it manually or use the "Check now" button on the
Reminders page, which scans just your own company. Emails go out via
Resend and are skipped (logged only) until `RESEND_API_KEY` is set.
Each expiry date gets its own set of reminders, so renewing a document and
moving the date starts the thresholds over. Each cron run emails every
notification from the last two days that hasn't been emailed yet,
including ones created by "Check now".
