# Old Timer's

Bulgarian-language full-stack web app for sourcing parts for classic / retro automobiles.
Customers describe what they're looking for; admins receive the lead, source it, and
respond with a quote. The site also publishes editorial articles (история, любопитни,
съвети) about classic cars.

## Stack

- **Next.js 16** (App Router, src dir, TypeScript strict)
- **Postgres 17** + **Prisma 7** (with `@prisma/adapter-pg` driver adapter)
- **Better Auth 1.6** (email/password, USER/ADMIN roles via the admin plugin)
- **Tailwind v4** + **shadcn/ui** (radix primitives, brand: cream / dusty pink / burgundy)
- **TipTap 3** (rich-text editor for articles, with image upload via `sharp`)
- **Cloudflare Turnstile** (anti-spam on public forms)
- **Zod** + **react-hook-form** (form validation)
- **Pino** (structured JSON logging)
- **Vitest** (unit) + **Playwright** (e2e)

## Local development

Prerequisites: **Docker Desktop**. Nothing else — Node, pnpm, Prisma, Playwright
all run inside containers.

```bash
# 1. Copy env template, fill in real values
cp .env.example .env.local

# 2. Boot the whole stack (db + app) with hot reload
docker compose --env-file .env.local up
```

App at <http://localhost:3000>. The `app` container runs
`prisma migrate deploy` on start, then `pnpm dev`.

> The dev `db` is exposed on host port `5433` (not the default 5432) to avoid
> clashes with a locally-installed Postgres. Connect with
> `psql -h localhost -p 5433 -U oldtimers oldtimers`.

### Working inside the container

Run any pnpm or prisma command with `docker compose exec app …`:

```bash
docker compose exec app pnpm typecheck
docker compose exec app pnpm lint
docker compose exec app pnpm test                       # vitest
docker compose exec app pnpm prisma migrate dev --name <change>
docker compose exec app pnpm prisma studio              # then open http://localhost:5555
docker compose exec db psql -U oldtimers -d oldtimers
```

### VS Code (recommended)

Install the **Dev Containers** extension and run **"Dev Containers: Reopen in
Container"**. VS Code attaches to the running `app` container so TypeScript,
ESLint, and Tailwind IntelliSense work against the container's `node_modules`
(your host stays clean).

### Hot reload on Windows / WSL

The `app` service sets `WATCHPACK_POLLING=true` and `CHOKIDAR_USEPOLLING=true`
so file changes through the bind mount actually trigger Next's dev server.
Don't remove these on Windows.

### End-to-end tests (separate container)

Playwright runs in its own container with browsers preinstalled:

```bash
docker compose --profile test run --rm playwright
```

It connects to the `app` service over the Docker network at `http://app:3000`,
so the app must already be running (`docker compose up`). To run a single spec:

```bash
docker compose --profile test run --rm playwright \
  pnpm exec playwright test tests/e2e/public-routes.spec.ts -g "homepage"
```

## Bootstrapping the first admin

There is no seed script and public sign-up is disabled
(`emailAndPassword.disableSignUp` in [src/lib/auth.ts](./src/lib/auth.ts)).
To create the first admin:

1. Temporarily flip `disableSignUp` to `false` in [src/lib/auth.ts](./src/lib/auth.ts).
2. Visit `/login` → there is no UI for sign-up (the form has been removed), so
   POST to the Better Auth endpoint directly. For a one-off:

   ```bash
   curl -X POST http://localhost:3000/api/auth/sign-up/email \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com","password":"choose-one","name":"You"}'
   ```

3. Promote the row in the `User` table:

   ```bash
   docker compose --env-file .env.local exec db \
     psql -U oldtimers -d oldtimers \
     -c "UPDATE \"User\" SET role='ADMIN' WHERE email='you@example.com';"
   ```

4. Re-set `disableSignUp` back to `true` and sign in at `/login`.
5. From `/admin/users`, every subsequent admin promotion/demotion is in-app.

## Environment variables

See [.env.example](./.env.example). All required at runtime:

| Var | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (URL-encoded password) |
| `DATABASE_PASSWORD` | Plain password, used by Docker compose |
| `BETTER_AUTH_SECRET` | 32+ random bytes, base64 |
| `BETTER_AUTH_URL` | Public origin (`http://localhost:3000` in dev) |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Same site key, exposed to the browser |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional |

## Scripts

All run via `docker compose exec app pnpm <script>` (or inside the dev container).

```
dev               Next dev server with Turbopack
build             Production Next build (standalone output)
lint              ESLint
typecheck         tsc --noEmit
test              Vitest unit tests
test:e2e          Playwright e2e (uses webServer; for the containerised flow,
                  see "End-to-end tests" above)
prisma:migrate    Create + apply a dev migration
prisma:studio     Open Prisma Studio
```

## Routes

- **Public:** `/`, `/articles`, `/articles/[slug]`, `/order`, `/order/success`,
  `/contact`, `/about`, `/privacy`, `/terms`
- **Auth:** `/login` (admin-only — public sign-up is disabled)
- **Admin (ADMIN role required):** `/admin`, `/admin/articles`, `/admin/articles/new`,
  `/admin/articles/[id]/edit`, `/admin/orders`, `/admin/orders/[id]`,
  `/admin/messages`, `/admin/messages/[id]`, `/admin/users`
- **API:** `/api/auth/[...all]` (Better Auth), `/api/upload` (admin image
  ingest), `/api/images/[id]` (public image read)

The `/admin/*` route group is gated by [src/proxy.ts](./src/proxy.ts) (Next.js 16's
renamed middleware). **Every server action and admin page also re-checks `role === 'ADMIN'`**
server-side — middleware alone is not safe (CVE-2025-29927).

## Production build (Docker)

```bash
docker compose --profile prod --env-file .env.local build app
docker compose --profile prod --env-file .env.local up
```

The prod target is a multi-stage build that uses Next's `standalone` output with
only the runtime dependencies. Migrations run on container start
(`prisma migrate deploy`).

## Postgres backup / restore

```bash
# Manual snapshot
docker compose --env-file .env.local exec db \
  pg_dump -U oldtimers -F c -f /tmp/oldtimers.dump oldtimers
docker compose --env-file .env.local cp db:/tmp/oldtimers.dump ./backups/

# Automated daily snapshot in production (keeps 14 days)
docker compose --profile prod --env-file .env.local up -d pgbackup

# Restore
docker compose --env-file .env.local exec -T db \
  pg_restore -U oldtimers -d oldtimers --clean --if-exists \
  < ./backups/oldtimers-YYYYMMDD-HHMMSS.dump
```

## Repo layout

```
prisma/                  schema and migrations
scripts/                 one-off maintenance scripts (e.g. import-covers.mjs,
                         the filesystem→DB image backfill)
src/app/                 Next App Router (public + (admin) + api/*)
src/components/          UI (layout, articles, forms, editor, admin, ui [shadcn])
src/server/              "use server" actions (articles, orders, contact, users)
src/lib/                 db client, auth, env, turnstile, rate-limit, logger, schemas
public/                  static assets (logo, favicon)
tests/unit/              Vitest unit tests
tests/e2e/               Playwright e2e tests
```

Uploaded images are **not** on disk — they live in the Postgres `Image` table
(see [ARCHITECTURE.md](./ARCHITECTURE.md#image-upload)) and are served via
`/api/images/[id]`.

## Notes

- All user-facing copy is **Bulgarian**. Logs and code identifiers are English.
- Cyrillic glyph forms render in their Bulgarian variant (verify б, в, г, д, ж, и).
- Contact info on `/contact` is a placeholder (`по заявка`) — fill in real values
  before launch.
- Privacy and Terms pages are flagged as drafts and must be reviewed by a Bulgarian
  lawyer before going to production.
- Rate limiting is in-memory (`Map`); if you scale beyond one app replica, swap
  [src/lib/rate-limit.ts](./src/lib/rate-limit.ts) to use Upstash Redis.
