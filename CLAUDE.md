# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Old Timer's — a Bulgarian-language full-stack web app where customers submit leads
for hard-to-find classic-car parts; admins manage articles, orders, and contact
submissions. Built locally in Docker; deployment is explicitly out of scope.

## Commands

**Everything runs in Docker.** The host has no Node, pnpm, Prisma, or
Playwright installed by design — all tooling lives inside containers. Prefix
pnpm/prisma calls with `docker compose exec app …`.

```bash
# Dev loop — boots db + app (hot reload)
docker compose --env-file .env.local up

# Quality gates (run all three before claiming a phase complete)
docker compose exec app pnpm typecheck
docker compose exec app pnpm lint
docker compose exec app pnpm test                            # vitest (unit)
docker compose --profile test run --rm playwright            # e2e, separate container

# Single test
docker compose exec app pnpm exec vitest run tests/unit/order.schema.test.ts
docker compose --profile test run --rm playwright \
  pnpm exec playwright test tests/e2e/public-routes.spec.ts -g "homepage"

# Prisma
docker compose exec app pnpm prisma migrate dev --name <change>
docker compose exec app pnpm prisma generate                 # after schema edits
docker compose exec app pnpm prisma studio                   # http://localhost:5555
docker compose --env-file .env.local exec db psql -U oldtimers -d oldtimers

# Production Docker build (slow)
docker compose --profile prod --env-file .env.local build app
docker compose --profile prod --env-file .env.local up
```

The dev `db` is exposed on host port **5433** (not 5432) to avoid clashing with a
locally installed Postgres. `DATABASE_URL` in `.env.local` already points there.

**VS Code**: use the **Dev Containers** extension and "Reopen in Container" so
TypeScript / ESLint / Tailwind IntelliSense resolves against the container's
`node_modules`. The [.devcontainer/devcontainer.json](./.devcontainer/devcontainer.json)
attaches to the `app` service. Without this, IDE tooling shows red squiggles
even though code is fine (host has no `node_modules`).

**Windows / WSL hot reload**: the `app` service sets `WATCHPACK_POLLING=true`
and `CHOKIDAR_USEPOLLING=true` because Docker bind-mount inotify events don't
propagate reliably on Windows. Don't remove them.

**Playwright** runs in a dedicated `playwright` service using
`mcr.microsoft.com/playwright:v1.59.1-noble` (browsers preinstalled — image tag
**must match** `@playwright/test` version in package.json). It connects to
`http://app:3000` via `PLAYWRIGHT_BASE_URL`, which makes
[playwright.config.ts](./playwright.config.ts) skip its own `webServer` block
and reuse the running `app` container. When upgrading Playwright, bump the tag
in [Dockerfile](./Dockerfile) too.

## Architecture

### Auth (Better Auth + Prisma)

- [src/lib/auth.ts](./src/lib/auth.ts) configures Better Auth with the Prisma
  adapter, email/password, and the `admin` plugin with `defaultRole: "USER"`
  and `adminRoles: ["ADMIN"]`. Roles are **uppercase strings** (not a Prisma
  enum) because Better Auth's admin plugin manages the column.
- [src/lib/session.ts](./src/lib/session.ts) exposes `requireAdmin()` /
  `requireUser()` / `getCurrentSession()`. Server actions and admin pages use
  these — they throw `"FORBIDDEN"` / `"UNAUTHENTICATED"` on failure.
- [src/proxy.ts](./src/proxy.ts) is the Next.js 16 **proxy** (renamed from
  `middleware`) and only does a cheap session-cookie check on `/admin/*` to
  short-circuit redirects. **It is not a security boundary.** Every server action
  and every admin page must independently call `requireAdmin()`. This mirrors the
  Next 16 docs warning about CVE-2025-29927 (proxy bypass via spoofed RSC headers).
- Public sign-up is disabled (`emailAndPassword.disableSignUp: true`). The
  site has no user-facing accounts; authentication exists only so admins can
  reach `/admin/*`. There is no seed script. To bootstrap the first admin,
  temporarily flip `disableSignUp` to `false`, POST to
  `/api/auth/sign-up/email`, `UPDATE "User" SET role='ADMIN' WHERE email='…';`,
  then flip the flag back and re-login.

### Database (Prisma 7 with driver adapter)

- Prisma 7 removed the `url` field from `schema.prisma`. The connection string
  lives in [prisma.config.ts](./prisma.config.ts), which loads `.env.local`.
- [src/lib/db.ts](./src/lib/db.ts) constructs `PrismaClient` with
  `@prisma/adapter-pg` — Prisma 7's "client" engine **requires** an adapter or
  Accelerate URL. Don't go back to the bare `new PrismaClient()` form.
- Seven models split into Better Auth core (`User`, `Account`, `Session`,
  `Verification`) and app data (`Article`, `Order`, `ContactSubmission`,
  `Image`). The `User` table carries the `role`, `banned`, `banReason`,
  `banExpires` columns required by the admin plugin. `Image` holds uploaded
  image bytes directly in Postgres (`Bytes` column) — uploads do not touch
  the filesystem.

### Server actions (`src/server/`)

Every action in [src/server/](./src/server/) returns a discriminated
`Result<T>` from [src/lib/result.ts](./src/lib/result.ts):
`{ success: true, data } | { success: false, error }`. UI code branches on
`r.success`; `error` is a Bulgarian string suitable for `toast.error`.

Pattern for any admin-only action:
1. `await requireAdmin()` — never trust the proxy alone.
2. Zod-validate the input.
3. (Public actions only) Verify the Turnstile token and apply
   [`rateLimit()`](./src/lib/rate-limit.ts) keyed by IP.
4. Mutate via `db`.
5. Log via Pino, not `console.log`.
6. Call `revalidatePath(...)` on every public route the change touches.

### Public form pipeline (`/order`, `/contact`)

Both share the same shape:

[`schemas/`](./src/lib/schemas/) (Zod) → client `<Form>` from
[`components/forms/`](./src/components/forms/) using `react-hook-form` +
`zodResolver` and Cloudflare Turnstile widget → server action in
[`server/`](./src/server/) → `verifyTurnstileToken()` →
`rateLimit("order:<ip>", 5, 1h)` → `db.create()`. **No outbound email** —
admins read submissions in `/admin/orders` and `/admin/messages` directly.

`TURNSTILE_SECRET_KEY` is **bypassed in dev** when missing
([src/lib/turnstile.ts:9](./src/lib/turnstile.ts)) so forms still work offline.
Don't remove this fallback.

### Articles (TipTap)

- Content is stored as TipTap JSON in `Article.content` (`Json` column).
- [`TiptapEditor`](./src/components/editor/TiptapEditor.tsx) (client) edits;
  [`TiptapRenderer`](./src/components/editor/TiptapRenderer.tsx) (server) calls
  `generateHTML` with the same extension list to render the article page.
  **Keep the extension lists in sync** — a mismatch silently drops content.
- Image uploads go through [`/api/upload`](./src/app/api/upload/route.ts):
  admin-gated, 5 MB cap, JPEG/PNG/WebP only, `sharp` resizes to 1920px max,
  then the bytes are persisted as a row in the `Image` table. The route
  returns `{ url: "/api/images/<id>" }`, which is what gets stored in TipTap
  nodes and `Article.coverImage`. Public reads go through
  [`/api/images/[id]`](./src/app/api/images/[id]/route.ts), which streams the
  bytes with the original `mimeType` and a long `Cache-Control`. Nothing lives
  on the local filesystem — `public/uploads/` is gone.
- Slugs are auto-generated by [`slugify()`](./src/lib/articles.ts), which
  transliterates Cyrillic to Latin. `ensureUniqueSlug()` in
  [src/server/articles.ts](./src/server/articles.ts) appends `-2`, `-3`, …
  on collision.

### Routing layout

- `src/app/page.tsx` is the homepage and embeds `<Header />` / `<Footer />`
  directly (it's outside the `(public)` group).
- `src/app/(public)/layout.tsx` wraps the rest of the public pages
  (`/articles`, `/about`, `/order`, `/contact`, `/privacy`, `/terms`).
- `src/app/(admin)/admin/layout.tsx` calls `auth.api.getSession()`, redirects
  non-admins, and renders the sidebar.
- `/login` lives at top level (not in `(public)`) and includes Header/Footer
  itself. There is no public sign-up route — `/login` is an admin-only entry
  point.

### Styling

- Brand tokens (cream `#F5EDE2` / dusty pink `#D4A5A5` / burgundy `#5C1A1B`)
  are layered on top of the shadcn variable scheme in
  [src/app/globals.css](./src/app/globals.css). Tailwind v4 `@theme inline`.
- Fonts are loaded in [src/app/layout.tsx](./src/app/layout.tsx) with
  `cyrillic` + `cyrillic-ext` subsets and `font-feature-settings: "locl"`.
  Removing `locl` will silently break Bulgarian glyph forms (б, в, г, д, ж, и
  render in Russian variants).

## Conventions

- All user-facing copy is in **Bulgarian**. Logs, identifiers, and types are
  English. Don't introduce English UI strings; don't introduce Bulgarian
  identifier names.
- Server components by default. Mark `"use client"` only for forms, editors,
  and interactive components.
- Use the `@/` import alias (maps to `src/`).
- Logging: `logger` from [src/lib/logger.ts](./src/lib/logger.ts) (Pino with
  PII redaction). No `console.log` in committed code.
- Live credentials live in `.env.local` (gitignored). Never read them into any
  committed file.
