# Xprim by Tagada — V1

> Your opinion has value. Answer surveys. Share your perspective. Earn points.

Xprim is a self-paced survey rewards platform. Respondents complete surveys (hosted by
Xprim or by external providers such as SurveyMonkey) to earn **XP**, which they can
redeem for rewards. Admins ("Research Managers") create and manage surveys, monitor
participation, and moderate reward redemptions — all without needing a developer.

This is **V1**: a small, clean, extensible foundation for the survey → completion → XP →
reward loop. See [What's intentionally not in V1](#whats-intentionally-not-in-v1) and the
roadmap at the bottom for what comes next.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** for styling (design tokens in `src/app/globals.css`)
- **PostgreSQL** + **Prisma 6** for the database
- **Auth.js (NextAuth v5)** with the Credentials provider (email + bcrypt-hashed password)
- **Vitest** for automated tests, run against a real Postgres test database
- **Zod** for input validation at every service boundary

Business logic lives in **server-side service functions** (`src/server/services/*`), not
in UI components or route handlers — API routes and pages are thin wrappers around them.
This is also what the test suite targets.

## Project structure

```
prisma/
  schema.prisma          Database schema (see "Database schema" below)
  seed.ts                 Demo data (admin, respondents, surveys, rewards)
src/
  app/                    Pages (App Router) and API routes
    (respondent pages)    /, /login, /register, /dashboard, /profile, /rewards, /surveys/complete
    admin/                /admin/* — the admin dashboard
    api/                  REST-ish JSON API, mirrors the services below
    privacy|terms|cookies/  Placeholder legal pages
  auth.ts                 NextAuth configuration (Credentials provider)
  proxy.ts                Route protection (auth + admin-only guard) — Next's "middleware" convention
  server/
    services/             All business logic, one file per domain, each with its own test file
    authz.ts               requireUser() / requireAdmin() helpers
    apiError.ts             Maps service errors to HTTP status codes
    fraud.ts                Privacy-safe IP hashing (groundwork for future fraud rules)
  components/              UI components (respondent + admin)
  lib/                     Prisma client singleton, countries list, small utilities
```

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL server (locally installed, or via Docker/any managed Postgres)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Session signing secret. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Base URL of the app (`http://localhost:3000` locally) |
| `AUTH_TRUST_HOST` | Yes (self-hosted) | Set to `true` when not deploying on Vercel, so Auth.js trusts the incoming `Host` header |
| `SURVEYMONKEY_CLIENT_ID` / `SURVEYMONKEY_CLIENT_SECRET` / `SURVEYMONKEY_ACCESS_TOKEN` | No | Reserved for a future proper SurveyMonkey API integration (see below). Not needed for V1 |
| `PAYMENT_PROVIDER_API_KEY` | No | Reserved for future automated reward payouts. Not used in V1 |

Create the database referenced by `DATABASE_URL` if it doesn't exist yet, e.g.:

```bash
createdb xprim_dev
```

### 4. Run migrations and seed demo data

```bash
npx prisma migrate deploy   # or: npm run db:migrate (creates a new migration in dev)
npm run db:seed
```

This creates:

- **1 admin**: `admin@xprim.test` / `AdminPass123!`
- **3 demo respondents** (password `RespondentPass123!` for all): `gaelle@xprim.test`,
  `jonathan@xprim.test`, `amara@xprim.test` — Amara is based in South Africa specifically
  to demonstrate country-based survey eligibility filtering (Mauritius-only surveys won't
  show up for her).
- **5 demo surveys**: Mauritius Grocery Habits, Digital Banking & Payments, Food Delivery
  Habits, Entertainment & Streaming, Travel Preferences — different durations and XP
  rewards, all published.
- **3 rewards**: Rs 100 / 250 / 500 vouchers.
- Some pre-existing participations, XP transactions, and one pending reward redemption
  request, so the admin dashboard isn't empty on first login.

The seed script is idempotent — re-running it won't create duplicates.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run the tests

Tests run against a **separate real Postgres database** (never the dev database) so they
exercise real Prisma queries, transactions, and unique constraints rather than mocks.

```bash
createdb xprim_test          # once
cp .env.test.example .env.test   # if you don't already have one — see below
npx prisma migrate deploy    # with DATABASE_URL pointed at xprim_test
npm test                     # single run
npm run test:watch           # watch mode
```

`.env.test` just needs a `DATABASE_URL` pointing at the test database (and dummy
`AUTH_SECRET`/`NEXTAUTH_URL` values); see the one already checked into this repo's local
setup for the exact shape (it's gitignored, so create your own from `.env.example` and
swap the database name).

The suite covers business logic only (per the "test business logic, not UI" principle):
registration/login/profile updates, survey create/publish/pause/close, eligibility
filtering, participation start/complete/duplicate-prevention/expiry, XP transactions, and
reward redemption/approval/rejection — 56 tests across 6 files.

## Core concepts

### XP ledger, not a stored balance

A user's XP balance is **never stored directly** — it's always the sum of their
`PointTransaction` rows (`src/server/services/points.ts`). Every award, redemption, and
refund creates a transaction. This is deliberate: it's what makes reward reversals,
promotions, bonuses, and fraud-driven adjustments possible later without a schema change.

### Participations = completion tracking

A `Participation` is created the moment a respondent clicks **Start survey**, with status
`STARTED`. Points are **only** awarded when it transitions to `COMPLETED`
(`completeSurvey()` in `src/server/services/participation.ts`), and a unique
`(userId, surveyId)` database constraint makes double-completion structurally impossible,
not just application-logic-dependent.

### External survey completion (V1's honest mock)

Xprim doesn't require surveys to be hosted inside it. Starting a survey opens the
provider's external URL (in a new tab) and sends the respondent to
`/surveys/complete?surveyId=...`, where they confirm **"I've completed this survey"** —
that calls `POST /api/participations/complete`, which awards XP server-side.

This is a **deliberately visible, manual/dev completion step**, not a faked production
webhook. A real provider integration (e.g. a SurveyMonkey webhook) would call the exact
same `completeSurvey()` service function server-to-server instead of relying on the
respondent's browser — see `SurveyProvider` in the schema for where that plugs in.

### SurveyProvider

Every survey belongs to a `SurveyProvider` (`MANUAL` or `SURVEYMONKEY` in V1). Creating a
survey in the admin UI lets you pick a provider type, an external URL, and — for
SurveyMonkey — an optional survey ID. No SurveyMonkey credentials are required for V1;
the `SURVEYMONKEY_*` environment variables are reserved for a future proper API
integration (pulling survey metadata, webhook-driven completion) without needing to
change the `Survey`/`SurveyProvider` data model.

### Server-side authorization everywhere

- `requireUser()` / `requireAdmin()` (`src/server/authz.ts`) gate every API route.
- `proxy.ts` (Next's "middleware" file, renamed in recent Next.js versions) redirects
  unauthenticated visitors away from `/dashboard`, `/profile`, `/rewards`, and `/admin`,
  and redirects non-admins away from `/admin`.
- XP amounts, eligibility, and survey state transitions are **always** computed
  server-side from the database — never trusted from the client.

## Database schema

See `prisma/schema.prisma` for the full definition. At a glance:

- `User` / `Profile` — account + extensible profiling data (the profile model is designed
  to grow: add a column, it's automatically part of `calculateProfileCompletion()`'s
  tracked fields if you add it to the list in `src/server/services/profile.ts`).
- `SurveyProvider` / `Survey` / `SurveyEligibility` — the survey catalogue and basic
  targeting (country / age range / gender).
- `Participation` — one row per (user, survey), the source of truth for completion
  tracking and future fraud analysis (`ipHash`, `userAgent`, timestamps are captured).
- `PointTransaction` — the XP ledger.
- `Reward` / `RewardRedemption` — the rewards catalogue and redemption requests.

`AdminUser` from the original spec is implemented as `User.role` (`RESPONDENT` |
`ADMIN`) rather than a separate table, since V1 doesn't need admin-specific fields beyond
role — splitting it out later is a small migration if that changes.

## What's intentionally not in V1

Per the product brief: no games, referrals, leaderboards, streaks, badges, social
features, AI survey matching, automated payouts, multi-language support, or a
sophisticated fraud engine. The schema and service layer are structured so these can be
added later without a rewrite (e.g. `PointTransaction.type` already has `BONUS` for
future promotions; `Participation` already captures fraud-relevant metadata that nothing
currently acts on).

## Roadmap (not built, but designed for)

- **Phase 2**: SurveyMonkey API integration (metadata pull + webhook-driven completion),
  CSV survey import, email notifications, survey quotas, richer profiling.
- **Phase 3**: gamification, referrals, personalized recommendations, a bigger rewards
  catalogue.
- **Phase 4**: native apps, client portals, in-house survey authoring.

## Security notes

- Passwords are hashed with bcrypt (never stored or logged in plaintext).
- All service-layer inputs are validated with Zod.
- Every admin route checks `role === "ADMIN"` server-side, in addition to the `proxy.ts`
  redirect (defense in depth — the redirect is a UX nicety, the API check is the real
  gate).
- Respondents can only ever read/mutate their own data; the admin API is the only place
  that can view other users' data.
- IP addresses are hashed (SHA-256) before storage, never kept raw — see
  `src/server/fraud.ts`.
