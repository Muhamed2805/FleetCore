# FleetCore

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
- [ ] Phase 3 — Dashboard shell (layout, sidebar, navigation)
- [ ] Phase 4 — Vehicles CRUD + document uploads
- [ ] Phase 5 — Reminders (email + in-app, customizable thresholds)
- [ ] Phase 6 — Maintenance, service history, expense tracking
- [ ] Phase 7 — KPI dashboard, charts, calendar view, advanced search
- [ ] Phase 8 — AI-powered data extraction from documents
- [ ] Phase 9 — Polish, accessibility, deploy

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

### Roles

Every signup creates a new company and its first user as `admin`. Roles are
`admin`, `fleet_manager`, `mechanic`, `driver` (see
`supabase/migrations/20260805210300_init_auth_schema.sql`). Inviting
teammates into an existing company is a later phase.
