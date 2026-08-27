# Aperture — Working Members Portal

Internal portal for the working members of **Aperture, The Digital Arts Society**: a member directory, event/project tracking, and announcements, gated behind a four-tier role hierarchy.

## Roles

In descending priority:

1. **Webadmin** — full access, including account creation, role changes, password resets, and activation/deactivation (`/admin/users`).
2. **Core Member** — creates/edits events, manages event assignments, posts and pins announcements.
3. **Team Aperture** — views everything, updates their own task status on assigned events.
4. **Working Team** — same as above; the baseline access level for a working member.

Only a Webadmin can create accounts or touch anyone's credentials.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (via the `@prisma/adapter-better-sqlite3` driver adapter)
- Auth.js (`next-auth` v5) — credentials login, JWT sessions, "keep me logged in" support

## Getting started

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Seeded accounts

The seed script (`prisma/seed.ts`) creates one account per role so you can test the RBAC gating. **Change these passwords after first login** — there's no self-service password change yet, so ask a Webadmin to reset it via `/admin/users`.

| Role | Email | Password |
| --- | --- | --- |
| Webadmin | `admin@apertureart.org` | `ChangeMe!2026` |
| Core Member | `meera@apertureart.org` | `CoreMember!123` |
| Team Aperture | `rohan@apertureart.org` | `TeamAperture!123` |
| Working Team | `ananya@apertureart.org` | `WorkingTeam!123` |

The Webadmin email/password used by the seed script are read from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` — change those before re-seeding a real environment.

## "Keep me logged in"

Sessions default to an 8-hour token lifetime. Checking "Keep me logged in" at login extends that to 30 days. This is enforced by a custom JWT `encode`/`decode` in `src/auth.ts`, independent of the session cookie's own expiry.

## Project structure

- `src/app/(portal)` — everything behind login (dashboard, directory, events, announcements, admin), sharing the nav in `src/app/(portal)/layout.tsx`.
- `src/app/login` — the sign-in page and its server action.
- `src/proxy.ts` — route protection: redirects unauthenticated requests to `/login`, and restricts `/admin/*` to Webadmins.
- `src/auth.ts` / `src/auth.config.ts` — Auth.js configuration (split so the edge-run proxy doesn't need to bundle bcrypt/Prisma).
- `src/lib/roles.ts` — the role hierarchy and permission helpers (`hasRole`, `isCoreOrAbove`, `isWebadmin`).
- `prisma/schema.prisma` — data model (`User`, `Event`, `EventAssignment`, `Announcement`).

## Notes for a real deployment

- Swap SQLite for a hosted database (e.g. Postgres) by changing the Prisma datasource/adapter — the schema itself is portable.
- Set a fresh `AUTH_SECRET` in production (`.env` has a locally-generated one for dev only).
- There's no self-service "forgot password" flow yet — resets go through a Webadmin.

## Contributors

- **Ioniser69** (<tanaychandra2007@gmail.com>) — Project Setup & Maintenance

