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
4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Checks

CI (`.github/workflows/ci.yml`) runs on every pull request and every push
to `main`: lint, typecheck and a production build, on the Node version in
`.nvmrc`. Run the same locally before opening a PR:

```bash
npm run lint
npm run typecheck
npm run build
```

### Roles

Every signup creates a new company and its first user as `admin`. Roles are
`admin`, `fleet_manager`, `mechanic`, `driver` (see
`supabase/migrations/20260805210300_init_auth_schema.sql`). Admins bring
teammates into the company from the Team page (below).

### Team

Admins invite people by email with a role from the Team page. The invitee
opens the link (`/invite/<token>`, valid 7 days) and creates an account with
that email; the signup trigger adds them to the inviting company with the
invited role instead of creating a new company. Invitations are for new
accounts only — a user belongs to exactly one company. Invite emails go out
via Resend; without `RESEND_API_KEY` nothing is sent and the admin gets a
link to copy and share instead.

Admins can change any other member's role and remove members (which deletes
their account; records they created stay, with the author cleared). Admins
can't change their own role or remove themselves, so a company always keeps
at least one admin.

### AI document extraction

The "Scan registration document" / "Scan receipt or invoice" buttons on the
Add Vehicle and Add Expense forms send an uploaded image or PDF to Claude
(structured outputs, so the response always matches the expected schema) and
prefill the form. Requires `ANTHROPIC_API_KEY`; without it the button shows
a clear "not configured" message instead of failing silently.

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
