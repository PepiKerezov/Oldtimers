# Architecture

This document describes what Old Timer's is and how its pieces fit together. For
how to run it, see [README.md](./README.md). For agent-facing rules, see
[CLAUDE.md](./CLAUDE.md).

## What it is

Old Timer's is a Bulgarian-language web app for sourcing hard-to-find parts for
classic cars. Two audiences:

- **Customers** describe a part through a public order form. The submission is
  stored in the database; the customer sees an on-page confirmation
  (`/order/success`). No email goes out in either direction — admins triage in
  `/admin/orders`. Sourcing and quoting happens off-platform; the app only
  manages the lead.
- **Admins** manage articles (editorial content in four categories — новини,
  история, любопитни, съвети), triage incoming orders and contact messages, and
  promote/demote other users.

There is no payment, no public user profile, and no automated sourcing. The
order form is a structured intake; everything that happens after submission is
manual and tracked through `OrderStatus`.

## Stack at a glance

| Concern | Choice |
| --- | --- |
| Runtime / framework | Next.js 16 App Router, React 19, TypeScript strict |
| Database | Postgres 17 + Prisma 7 with `@prisma/adapter-pg` driver adapter |
| Auth | Better Auth 1.6 (email/password + admin plugin) |
| UI | Tailwind v4, shadcn/ui (radix primitives), brand tokens layered on top |
| Editor | TipTap 3 (JSON storage, server-side render via `generateHTML`) |
| Anti-spam | Cloudflare Turnstile (server-verified) + in-memory rate limit |
| Validation | Zod everywhere, react-hook-form on the client |
| Logging | Pino with PII redaction |
| Tests | Vitest (unit) + Playwright (e2e) |
| Packaging | Docker (dev, prod, and playwright targets in one Dockerfile) |

## Domain model

Seven Prisma models in [prisma/schema.prisma](./prisma/schema.prisma), split into
two groups.

**Better Auth core** — fully owned by the auth library, do not query for app
logic except through `auth.api.*`:

- `User` — also carries the admin-plugin columns (`role`, `banned`,
  `banReason`, `banExpires`). `role` is a plain string column (not a Prisma
  enum) because Better Auth manages writes to it.
- `Account` — OAuth provider links and password hashes (one row per
  provider per user).
- `Session` — active sessions, with optional `impersonatedBy` from the admin
  plugin's "act as user" feature.
- `Verification` — short-lived tokens (email verification, password reset).

**App data:**

- `Article` — slug-keyed editorial content. `content` is TipTap JSON; the
  HTML is regenerated on render. `category` is an enum
  (`novini | istoriya | lyubopitni | saveti`). `authorId` is `SetNull` on
  user delete so an admin's removal doesn't wipe their articles.
- `Order` — an inbound part request. `status` enum tracks the manual sourcing
  pipeline (`NEW → FINDING → DONE | REFUSED`).
  IP is stored alongside the row for audit and for the rate-limiter.
- `ContactSubmission` — an inbound message (`name`, `email`, `subject`,
  `message`) with a `handled` boolean the admin toggles when triaged.
- `Image` — uploaded image bytes stored directly in Postgres (`bytes` is a
  `Bytes` column, plus `mimeType`, `width`, `height`, `byteSize`). Written by
  `/api/upload`, read by `/api/images/[id]`. Keeps uploads inside the database
  backup boundary and avoids a separate object store.

Indexes are placed for the queries the app actually runs: `(published,
publishedAt)` for the public articles feed, `(status, createdAt)` for the
admin orders queue, `(handled, createdAt)` for the messages queue.

## Authentication and authorisation

[src/lib/auth.ts](./src/lib/auth.ts) wires Better Auth with the Prisma adapter,
email/password (8-char minimum, auto sign-in, `disableSignUp: true`), and the
`admin` plugin (`defaultRole: "USER"`, `adminRoles: ["ADMIN"]`). Sessions live
for 30 days with a 24-hour rolling update window and a 5-minute cookie cache so
most requests don't hit the database.

Public registration is intentionally off — the site has no user-facing
accounts. Authentication exists only so admins can reach `/admin/*`.

There is **no seed**. To bootstrap the first admin, temporarily flip
`disableSignUp` to `false`, POST to `/api/auth/sign-up/email`,
`UPDATE "User" SET role='ADMIN' WHERE email='…';`, then flip the flag back.
After that, `/admin/users` handles every promotion.

### The two-layer authorisation pattern

Authorisation is enforced **twice**, and the layers are not interchangeable:

1. **[src/proxy.ts](./src/proxy.ts)** — Next.js 16 renamed `middleware.ts` to
   `proxy.ts`. It checks for a session cookie on `/admin/*` and redirects
   unauthenticated users to `/login`. This is a UX optimisation (avoid
   rendering an admin shell that immediately bounces); **it is not a security
   boundary**. Next 16's docs explicitly warn about CVE-2025-29927 — proxy
   logic can be bypassed by a spoofed `x-middleware-subrequest` header.
2. **[src/lib/session.ts](./src/lib/session.ts)** — `requireAdmin()` /
   `requireUser()` / `getCurrentSession()` re-query Better Auth via
   `auth.api.getSession({ headers })` and throw `"FORBIDDEN"` /
   `"UNAUTHENTICATED"` strings. **Every** server action and **every** admin
   page calls one of these. The proxy is an optimisation around it, not a
   replacement for it.

The same rule applies to user management actions in
[src/server/users.ts](./src/server/users.ts): `demoteToUser` refuses
self-demotion and last-admin demotion (counts admins first; rejects if `<= 1`).

## Server actions and the `Result<T>` contract

Every mutation in [src/server/](./src/server/) is a `"use server"` function
that returns a discriminated union from
[src/lib/result.ts](./src/lib/result.ts):

```ts
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

`error` is a Bulgarian string suitable for `toast.error(...)` — UI code never
constructs error messages from action output, it just displays them. Action
functions never throw across the boundary; failures are caught, logged, and
returned as `{ success: false, error }`.

The canonical pattern, from [src/server/orders.ts](./src/server/orders.ts):

1. Resolve the request IP (`getClientIp(headers)` from
   [src/lib/rate-limit.ts](./src/lib/rate-limit.ts)).
2. Apply [`rateLimit(key, n, windowMs)`](./src/lib/rate-limit.ts) before any
   work that costs DB or external calls.
3. **For admin actions:** call `requireAdmin()` first, never trust the proxy.
4. Zod-parse the input. The first issue's message becomes the user-facing
   error.
5. **For public actions:** `verifyTurnstileToken(token, ip)`.
6. Mutate via `db`.
7. `revalidatePath(...)` for every public route the change touches
   (homepage, `/articles`, the specific article page, etc.).

## Public form pipeline (`/order`, `/contact`)

Both follow an identical shape:

```
Zod schema (src/lib/schemas/)
  ↓
react-hook-form + zodResolver (src/components/forms/)
  ↓ (client → server action)
verifyTurnstileToken()  ← Cloudflare bot check (server-side, with secret)
  ↓
rateLimit("order:<ip>", 5, 1h)
  ↓
db.create(...)
```

Admins triage new orders / messages by visiting `/admin/orders` and
`/admin/messages` directly — there is no outbound notification today.

A few non-obvious details:

- **Turnstile dev-bypass**: when `TURNSTILE_SECRET_KEY` is missing,
  [`verifyTurnstileToken`](./src/lib/turnstile.ts) returns `true` so forms
  still work offline / before keys are issued. The widget on the client side
  also has a sandbox mode using `1x00000000000000000000AA`. **Do not** remove
  the bypass; do **not** ship without setting the real key in production.
- **Bulgarian phone regex**: `/^(\+359|0)[0-9]{8,9}$/` — accepts the local
  prefix or international, no spaces or dashes. Tested in
  [tests/unit/order.schema.test.ts](./tests/unit/order.schema.test.ts).
- **In-memory rate limit**: a `Map<string, { count, resetAt }>` in
  [src/lib/rate-limit.ts](./src/lib/rate-limit.ts). Per-process — fine while
  the app runs as a single container. If the deployment ever scales
  horizontally, this needs to move to Redis (Upstash) or the limit becomes
  effectively `n × replicas`.

## Articles and TipTap

Article content is stored as TipTap JSON in the `Article.content` JSON
column. Two pieces have to stay aligned:

- **[TiptapEditor](./src/components/editor/TiptapEditor.tsx)** — client
  component used in the admin form. Loads StarterKit + Image + Link. Toolbar
  drives the same extensions.
- **[TiptapRenderer](./src/components/editor/TiptapRenderer.tsx)** — server
  component used on the public article page. Calls `generateHTML(json,
  extensions)` with the **same extension list** as the editor.

If those two lists drift, content silently disappears on render — the renderer
sees an unknown node type and skips it. Treat the extension list as a shared
contract.

### Slugs

[`slugify(title)`](./src/lib/articles.ts) transliterates Cyrillic to Latin
(`История на Old Timer's` → `istoriya-na-old-timers`), strips punctuation,
collapses whitespace, and caps at 80 chars.
[`ensureUniqueSlug`](./src/server/articles.ts#L11) appends `-2`, `-3`, … on
collision. Slugs are stable once published — editing a title doesn't rewrite
the slug unless you explicitly change the slug field.

### Image upload

[`/api/upload`](./src/app/api/upload/route.ts) is admin-gated, caps payloads at
5 MB, allows JPEG / PNG / WebP, and runs uploads through `sharp` to resize to
1920px max width. The resized bytes are written as a row in the `Image` table
(no filesystem writes); the route responds with `{ url: "/api/images/<id>" }`,
which is stored in TipTap nodes and `Article.coverImage`.
[`/api/images/[id]`](./src/app/api/images/[id]/route.ts) streams the bytes back
out with the original `Content-Type` and `Cache-Control: public, max-age=31536000, immutable`
(safe because rows are insert-only — each upload gets a fresh cuid; bytes for a
given id never change). One-off
backfill of pre-existing filesystem images into the table is in
[scripts/import-covers.mjs](./scripts/import-covers.mjs).

## Routing layout

The App Router structure is split across three groups:

- **Top-level pages** — `src/app/page.tsx` (homepage, embeds Header/Footer
  directly) and `src/app/login/` (admin-only entry point). Login is
  intentionally outside the `(public)` group so it can render its own
  centred layout. There is no public sign-up route.
- **`(public)` group** — `src/app/(public)/layout.tsx` wraps Header + Footer
  for `/articles`, `/articles/[slug]`, `/about`, `/order`,
  `/order/success`, `/contact`, `/privacy`, `/terms`.
- **`(admin)` group** — `src/app/(admin)/admin/layout.tsx` re-checks
  `requireAdmin` server-side, redirects on failure, and renders the sidebar.
  Pages: `/admin`, `/admin/articles`, `/admin/articles/new`,
  `/admin/articles/[id]/edit`, `/admin/orders`, `/admin/orders/[id]`,
  `/admin/messages`, `/admin/messages/[id]`, `/admin/users`.

API:

- `/api/auth/[...all]` — Better Auth's catch-all handler via
  `toNextJsHandler`. Owns sign-in, session, and the admin-plugin endpoints.
  Sign-up is disabled at the API level by `disableSignUp: true`.
- `/api/upload` — described above (admin-only image ingest).
- `/api/images/[id]` — public read of an `Image` row by id.

## Email

Outbound email is intentionally **not wired up** and was removed from the
codebase. Orders and contact submissions are stored in the database and
surfaced through the admin UI; neither the customer nor the admin receives a
notification. There is no `src/lib/email.ts`, no Resend / nodemailer
dependency, and no email-related env vars in [.env.example](./.env.example).
If this is reintroduced later, plug it into
[src/server/orders.ts](./src/server/orders.ts) and
[src/server/contact.ts](./src/server/contact.ts) after `db.create`, wrapped in
`try/catch` so a failed send never rolls back the row.

## Brand and typography

Brand colours: cream `#F5EDE2`, dusty pink `#D4A5A5`, burgundy `#5C1A1B`. They
are layered on top of the shadcn variable scheme inside
[src/app/globals.css](./src/app/globals.css) using Tailwind v4's
`@theme inline` block — adding tokens without forking the shadcn variables.

Two fonts are loaded in [src/app/layout.tsx](./src/app/layout.tsx):

- **Cormorant Garamond** for display.
- **Sofia Sans** for body and UI.

Both load with `cyrillic` and `cyrillic-ext` subsets and
`font-feature-settings: "locl"`. The `locl` feature is **load-bearing**:
without it, glyphs like б, в, г, д, ж, и render in their Russian forms even
when `<html lang="bg">` is set. Bulgarian users will recognise this as a
visual bug; non-Bulgarian devs may not.

## Logging

[src/lib/logger.ts](./src/lib/logger.ts) is a Pino instance with PII
redaction and `pino-pretty` formatting in dev. Use `logger.info`/`logger.error`
exclusively — `console.log` is banned in committed code (the lint config
enforces this). Standard event names follow `<resource>.<action>[.<state>]`,
e.g. `order.created`, `article.update.failed`.

`SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` env vars are wired in but Sentry
init code is intentionally minimal — it picks up errors thrown from
`requireAdmin` / `requireUser`, and from anything that escapes the action
try/catches.

## Container topology

[docker-compose.yml](./docker-compose.yml) defines three services:

- **app** — Next.js dev server with hot reload (or the prod standalone build,
  controlled by the `BUILD_TARGET` arg). Bind-mounted source, named volume
  for `node_modules` and `.next`. Sets `WATCHPACK_POLLING` and
  `CHOKIDAR_USEPOLLING` so file watching survives Docker bind mounts on
  Windows. Has a wget-based healthcheck that the playwright service depends
  on. Runs `prisma migrate deploy` then `pnpm dev` on start.
- **db** — Postgres 17 alpine, exposed on host port **5433** (not 5432) to
  avoid colliding with a locally installed Postgres. Data persists in
  `./pgdata/`.
- **playwright** — separate image
  (`mcr.microsoft.com/playwright:v1.59.1-noble`, browsers preinstalled),
  built from a dedicated stage in the [Dockerfile](./Dockerfile). Runs only
  under `--profile test`. Connects to `http://app:3000` over the Docker
  network via `PLAYWRIGHT_BASE_URL`, which makes
  [playwright.config.ts](./playwright.config.ts) skip its own `webServer`
  block. The image tag **must** match the `@playwright/test` version in
  package.json.
- **pgbackup** (prod profile only) — runs daily `pg_dump` on a 14-day
  retention window into `./backups/`.

The host has no Node, pnpm, Prisma, or Playwright. Everything runs inside
containers. VS Code attaches to the `app` container via
[.devcontainer/devcontainer.json](./.devcontainer/devcontainer.json) so
TypeScript / ESLint / Tailwind IntelliSense resolve against the container's
`node_modules`.

## What this codebase deliberately does *not* do

These are not "to do" — they are explicit non-goals:

- **Cloud deployment, custom domain, HTTPS termination.** The Docker setup is
  for local development only.
- **Transactional email.** No outbound mail is sent on order or contact
  submission. Admins triage everything in `/admin/*` directly.
- **S3 / MinIO uploads.** Uploaded images live in Postgres (`Image` table),
  not in object storage. This keeps backups single-source but means the DB
  grows with image volume; revisit if that ever becomes load-bearing.
- **i18n.** The app is Bulgarian-only by design; identifiers and logs are
  English by convention.
- **Distributed rate limiting.** In-memory, single-process. Scaling out
  requires swapping in Redis.
- **Payments, public user profiles, comments.**
