**OLD TIMER'S**

**Deployment Plan — Vercel \+ SuperHosting domain (oldtimers.online)**

*How to take the Next.js 16 app from a local Docker setup to a live production site.*

| Read this first — what changed since the old plan Your README / ARCHITECTURE / CLAUDE files describe a stack that is meaningfully different from a generic "deploy Next.js" plan. The three things that drive every decision below: The app currently runs only in Docker for local dev. Cloud deployment, a custom domain and HTTPS are explicitly listed as non-goals in ARCHITECTURE.md — so there is setup work, not just a button press. Uploaded images are stored as bytes inside Postgres (the Image table), not on disk and not in object storage. This is fine on Vercel, but it means your database must be a real, always-on Postgres — not the local Docker container — and it will grow with image volume. Prisma 7 with the @prisma/adapter-pg driver adapter, Better Auth, and Cloudflare Turnstile each need specific environment variables and a couple of small config considerations on a serverless host. Net effect: you need three things working together — (1) the Vercel project, (2) a managed Postgres database, (3) DNS on the oldtimers.online domain at SuperHosting. The rest of this document walks each one. |
| :---- |

# **1\. Target architecture**

After deployment the pieces fit together like this:

* **Vercel** hosts the Next.js 16 app — builds it, serves pages and server actions, terminates HTTPS, and serves /api/images/\[id\].

* **A managed Postgres database** (Neon, Vercel Postgres, or Supabase) replaces the local Docker db container. It holds all seven Prisma models including the Image bytes.

* **SuperHosting** stays as your domain registrar / DNS host for oldtimers.online. You only change a few DNS records there to point the domain at Vercel.

* **Cloudflare Turnstile** provides the anti-spam keys for the public /order and /contact forms.

*What you do NOT need: the Docker setup in production, a separate object store (images live in Postgres), an email provider (outbound email was removed from the codebase), or a server you manage yourself.*

| Important caveat about the in-memory rate limiter src/lib/rate-limit.ts uses an in-process Map. On Vercel each serverless invocation can be a fresh process, so the rate limit becomes effectively per-invocation rather than per-IP. It will not break the app, but it will not really throttle either. For launch this is acceptable; if abuse becomes a problem, swap it for Upstash Redis as both the README and ARCHITECTURE docs already suggest. Note this now so it is a known limitation, not a surprise. |
| :---- |

# **2\. Set up the production database (do this first)**

Everything else depends on a reachable database, so start here. The local Docker Postgres on port 5433 is dev-only — it is not exposed to the internet and Vercel cannot reach it.

## **2.1 Pick a managed Postgres provider**

Any of these work with Prisma 7 \+ the pg driver adapter. All have a free tier that is fine for launch:

| Provider | Notes for this project |
| :---- | :---- |
| Neon | Serverless Postgres, generous free tier, integrates directly into the Vercel dashboard. Good default choice. |
| Vercel Postgres | Now Neon under the hood; provisioned from inside Vercel, env vars auto-injected. Simplest if you want one dashboard. |
| Supabase | Also fine. Use the "Session" connection string (port 5432\) or the pooled string — see 2.3. |

Recommendation: Neon (via the Vercel integration) — it auto-creates the env var and handles pooling. The steps below assume Neon but the shape is identical for the others.

## **2.2 Create the database**

1. Create an account with the provider and create a new Postgres project / database. Pick a region close to your users — for Bulgaria, Frankfurt (eu-central-1) is the usual best choice. Use the same region for your Vercel project later.

2. Copy the connection string it gives you. It looks like:

postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

3. If the provider offers both a **pooled** and a **direct** connection string, copy both — you will use both (see 2.3).

## **2.3 Connection pooling — why you need two URLs**

Serverless functions open many short-lived connections. A raw Postgres connection string will exhaust connection limits under load. The standard fix:

* DATABASE\_URL → the **pooled** connection string (PgBouncer / Neon pooler). This is what the running app uses at runtime.

* DIRECT\_URL → the **direct** (non-pooled) connection string. This is what prisma migrate uses, because migrations need a real single connection.

Then in prisma.config.ts (Prisma 7 keeps the connection config there, not in schema.prisma) make sure it reads DATABASE\_URL, and that any migrate command can see DIRECT\_URL. If you are on Neon's Vercel integration, it injects a pooled DATABASE\_URL automatically; you just add DIRECT\_URL yourself from the dashboard's "direct connection" string.

| Prisma 7 specifics for this repo src/lib/db.ts already constructs PrismaClient with @prisma/adapter-pg — keep it. Prisma 7's client engine requires the adapter; do not revert to bare new PrismaClient(). After any schema change you must run prisma generate. On Vercel this needs to happen on every build — see 4.3 for the build command. Migrations are applied with prisma migrate deploy (not migrate dev) in production — see 2.4. |
| :---- |

## **2.4 Apply the schema to the new database**

Your migrations live in prisma/. You need to run them once against the new cloud database before the app can work. You have no Node locally (host is Docker-only), so the cleanest way is to run the migrate command from inside your existing app container, but pointed at the cloud database:

\# from the project root, with the cloud DIRECT\_URL  
docker compose exec \\  
  \-e DATABASE\_URL="\<cloud DIRECT connection string\>" \\  
  app pnpm prisma migrate deploy  
Alternatively, run it as a one-off Vercel build step the first time (see 4.3) — many people just add prisma migrate deploy to the build command so every deploy applies pending migrations. That is the simplest long-term setup and is recommended here.

## **2.5 Bootstrap the first admin**

There is no seed script and public sign-up is disabled. The README's bootstrap procedure still applies, just against the cloud database. Once the site is live on Vercel:

4. Temporarily set emailAndPassword.disableSignUp to false in src/lib/auth.ts, commit, and let Vercel redeploy.

5. POST once to the live sign-up endpoint to create your account:

curl \-X POST https://oldtimers.online/api/auth/sign-up/email \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"email":"you@example.com","password":"choose-one","name":"You"}'

6. Promote that row to ADMIN. Connect to the cloud DB (via the provider's web SQL console, or psql) and run:

UPDATE "User" SET role='ADMIN' WHERE email='you@example.com';

7. Set disableSignUp back to true, commit, redeploy. From then on every admin promotion is done in-app at /admin/users.

# **3\. Prepare the repository for Vercel**

Vercel deploys from a Git repository (GitHub / GitLab / Bitbucket). A few checks before you connect it:

## **3.1 Push to a Git provider**

* If the project is not already on GitHub (or GitLab/Bitbucket), create a private repository and push it.

* .env.local must stay gitignored — it already is. Live credentials never go in the repo; they go into Vercel's environment variables (section 5).

## **3.2 Things that are Docker-specific and should be ignored on Vercel**

Vercel does not use your Dockerfile or docker-compose.yml — it has its own Next.js build pipeline. You do not need to delete those files (they are still useful for local dev), Vercel simply ignores them. A few related notes:

* The WATCHPACK\_POLLING / CHOKIDAR\_USEPOLLING vars are dev-only — they do nothing on Vercel, leave them.

* Playwright e2e tests run in their own container and are not part of the Vercel build. Do not wire them into the build command.

* The next.config output: "standalone" setting is for the Docker prod build. It is harmless on Vercel, but if the build complains you can gate it behind an env check. Usually it just works — test the build (3.3) and only touch it if it fails.

## **3.3 Test the production build locally first**

Before involving Vercel, confirm the app builds in production mode. Run it inside your container against the cloud database env:

docker compose exec app pnpm build  
Fix any type errors or build failures here — it is much faster to debug locally than in Vercel's build logs. The build must pass typecheck and lint cleanly.

# **4\. Create and configure the Vercel project**

## **4.1 Create the project**

8. Sign up at [vercel.com](https://vercel.com) (the Hobby plan is free and sufficient to launch).

9. Click "Add New… → Project", and import the Git repository you pushed in section 3\.

10. Vercel auto-detects Next.js. Framework preset: Next.js. Root directory: leave as the repo root (unless the app is in a subfolder).

11. Set the project region to match your database region (Frankfurt). Project Settings → Functions → Region.

## **4.2 Do NOT deploy yet**

The first deploy will fail without environment variables. Add them first (section 5), then trigger the deploy. If you accidentally deployed already, that is fine — just add the vars and redeploy.

## **4.3 Build & install commands**

In Project Settings → Build & Deployment, set:

| Setting | Value |
| :---- | :---- |
| Install Command | pnpm install |
| Build Command | pnpm prisma generate && pnpm prisma migrate deploy && pnpm build |
| Output | Leave default (Next.js) |

Why this build command:

* prisma generate — regenerates the Prisma client; required on every build since the client is not committed.

* prisma migrate deploy — applies any pending migrations to the production database automatically on each deploy. This is the simplest, most reliable approach and means you never forget to migrate.

* pnpm build — the normal Next.js production build.

Make sure Vercel uses pnpm (it auto-detects from pnpm-lock.yaml). If it does not, set the install command explicitly as above.

# **5\. Environment variables on Vercel**

Project Settings → Environment Variables. Add each of the following for the Production environment (and Preview, if you want preview deployments to work). These mirror .env.example plus the pooling split from section 2.3.

| Variable | Value / where it comes from |
| :---- | :---- |
| DATABASE\_URL | Pooled Postgres connection string from your provider. Used by the running app. |
| DIRECT\_URL | Direct (non-pooled) connection string. Used by prisma migrate deploy during the build. |
| BETTER\_AUTH\_SECRET | 32+ random bytes, base64. Generate with: openssl rand \-base64 32 |
| BETTER\_AUTH\_URL | https://oldtimers.online — the public production origin. Must be the real domain, not the .vercel.app URL, once DNS is live. |
| TURNSTILE\_SITE\_KEY | From the Cloudflare Turnstile dashboard (section 6). |
| TURNSTILE\_SECRET\_KEY | From Cloudflare Turnstile. Must be set in production — the dev bypass only triggers when it is missing. |
| NEXT\_PUBLIC\_TURNSTILE\_SITE\_KEY | Same value as TURNSTILE\_SITE\_KEY — this one is exposed to the browser. |
| SENTRY\_DSN | Optional. From Sentry, if you use it. |
| NEXT\_PUBLIC\_SENTRY\_DSN | Optional. Browser-side Sentry DSN. |

| Watch-outs for environment variables DATABASE\_PASSWORD from .env.example was only used by Docker Compose to start the local DB container. On Vercel you do not need it — the managed provider owns the password and it is already inside the connection strings. BETTER\_AUTH\_URL being wrong is the most common post-launch bug: auth cookies and redirects break. It must exactly match how users reach the site — https://oldtimers.online. Set it after DNS is live, or set it upfront and just don't test auth until DNS resolves. Anything not prefixed NEXT\_PUBLIC\_ is server-only and safe. Never put a secret behind a NEXT\_PUBLIC\_ name. After changing any env var you must redeploy — Vercel does not hot-reload them into an existing deployment. |
| :---- |

# **6\. Cloudflare Turnstile keys**

The public order and contact forms verify a Turnstile token server-side. In dev the check is bypassed when the secret is missing — that bypass must not be relied on in production.

12. Go to the Cloudflare dashboard → Turnstile → add a new site/widget.

13. Set the hostname to oldtimers.online (and add www.oldtimers.online if you keep the www version). You can also add your \*.vercel.app preview domain if you want forms to work on preview deploys.

14. Copy the **Site Key** and **Secret Key** into the three Turnstile env vars in section 5\.

15. Redeploy. Submit the /contact form on the live site to confirm the widget renders and submission succeeds.

# **7\. First deployment**

16. With env vars and build command in place, trigger a deploy (push a commit, or click "Redeploy" in Vercel).

17. Watch the build log. The Prisma generate \+ migrate deploy steps run first; then the Next build. The most common failures here are a wrong DATABASE\_URL/DIRECT\_URL or a type error that did not surface locally.

18. When it succeeds you get a …vercel.app URL. Open it and click through: homepage, /articles, /order, /contact, /login. Images served from /api/images/\[id\] should load.

19. At this point the app is live on the vercel.app URL but NOT yet on oldtimers.online. That is the next section.

# **8\. Connect the oldtimers.online domain**

Your domain is registered at SuperHosting and (by default) uses SuperHosting's nameservers. You will keep SuperHosting as the DNS host and just point a couple of records at Vercel. You do not need to transfer the domain or change registrar.

## **8.1 Add the domain in Vercel**

20. In your Vercel project: Settings → Domains → add oldtimers.online.

21. Also add www.oldtimers.online if you want the www version to work. Vercel lets you pick one as primary and auto-redirects the other — choosing the apex (oldtimers.online) as primary is the common choice.

22. Vercel will then show you the exact DNS records to create. It shows different records depending on apex vs subdomain — read what your dashboard shows; the values below are the typical ones but Vercel may give you project-specific values, in which case use those.

## **8.2 The DNS records you will create**

| Host / Name | Type | Value | Purpose |
| :---- | :---- | :---- | :---- |
| @ | A | 76.76.21.21 | Points the apex oldtimers.online at Vercel. Use the exact IP shown in your Vercel dashboard if it differs. |
| www | CNAME | cname.vercel-dns.com | Points www.oldtimers.online at Vercel. Vercel may show a project-specific CNAME target — use whatever it displays, copied exactly. |

If your Vercel dashboard shows a CAA record requirement (it can, if a CAA record already exists on the domain), also add a CAA record allowing letsencrypt.org so Vercel's certificate authority can issue the HTTPS certificate.

## **8.3 Where to add them in SuperHosting**

SuperHosting domains use SuperHosting's nameservers by default, and you edit records through their control panel:

23. Log in to your SuperHosting customer profile → **Domain Management**.

24. Find oldtimers.online, click **Settings** next to it.

25. Under **DNS settings** make sure **DNS hosting** is the active option (i.e. SuperHosting's nameservers are managing the zone), then click **Edit** to open the DNS record editor. On cPanel-based hosting the equivalent is **cPanel → Advanced DNS Editor**.

26. Add / edit the records from 8.2:

    * Find the existing A record for the apex (it currently points at SuperHosting's web server) and **change its value** to Vercel's IP. Do not leave the old one alongside the new one — conflicting A records cause intermittent failures.

    * Add (or edit) the www CNAME to point at the Vercel CNAME target. If a www A record already exists, remove it — you cannot have both an A and CNAME for the same host.

    * If Vercel asked for a CAA record, add it too.

27. Save. SuperHosting's editor applies the change to the zone.

| Decision: keep SuperHosting DNS, or move nameservers to Vercel? You have two valid approaches: Keep SuperHosting as DNS host (recommended here). Just edit the A \+ CNAME records as above. Lowest risk, keeps any existing email/MX records for the domain untouched, and you do not have to recreate anything. Move nameservers to Vercel. In Domain Management you would set the nameservers to Vercel's (ns1.vercel-dns.com / ns2.vercel-dns.com) and manage all records in Vercel. Cleaner if you want one dashboard, but you must first recreate every record you want to keep (especially MX/email) in Vercel, or you will break email for the domain. Only do this if you are comfortable inventorying the existing zone. *Unless you have a specific reason, keep SuperHosting DNS and just change the two records.* |
| :---- |

## **8.4 Lower the TTL beforehand (optional but smart)**

If the current A record has a long TTL, change can be slow and hard to roll back. Roughly 24 hours before you cut over, edit the existing A record's TTL down to 60 seconds and save. Then when you change the value the next day, propagation is fast and a rollback is fast too. If you are not in a hurry, you can skip this — propagation just takes longer (typically 2–48 hours per SuperHosting's own guidance).

## **8.5 Verify**

28. Back in Vercel → Settings → Domains, the domain status will flip to **Valid** once it sees the records. This can take minutes to a couple of hours.

29. Vercel then automatically provisions a free HTTPS certificate (Let's Encrypt). No action needed from you.

30. Check propagation yourself with dig oldtimers.online and dig www.oldtimers.online, or a site like dnschecker.org / whatsmydns.net.

31. Once https://oldtimers.online loads the site: go back and confirm BETTER\_AUTH\_URL is set to that exact URL, and redeploy if you changed it.

# **9\. Post-launch checklist**

These come straight from notes already in your README / ARCHITECTURE — handle them before or shortly after going live:

* **Bootstrap the first admin** (section 2.5) — you cannot reach /admin until you do.

* **Fill in real contact info.** /contact currently shows the placeholder по заявка — replace with real values before launch.

* **Get the Privacy and Terms pages reviewed.** They are flagged as drafts and the README says a Bulgarian lawyer should review them before production.

* **Verify Bulgarian glyphs render correctly** on the live site — check б, в, г, д, ж, и. The locl font feature is load-bearing; if it broke in the build, the letters render in Russian forms.

* **Test the full form pipeline live** — submit a real /order and /contact, confirm Turnstile passes and the rows appear in /admin/orders and /admin/messages.

* **Test an image upload** through the article editor — confirm it lands in the Image table and serves back via /api/images/\[id\]. Note the 5 MB cap and JPEG/PNG/WebP-only rule.

* **Set up database backups.** The pgbackup Docker service does not run on Vercel. Use your DB provider's built-in backups (Neon and Supabase both have point-in-time / scheduled backups) — turn them on and verify the retention window.

* **Decide on the rate limiter.** If the in-memory limiter's ineffectiveness on serverless matters to you, move src/lib/rate-limit.ts to Upstash Redis. Otherwise note it as a known limitation.

* **Watch the database size.** Because images are stored as bytes in Postgres, the DB grows with every upload. Keep an eye on your provider's storage quota over time.

# **10\. How deploys work from now on**

* Every push to your main branch triggers a production deploy on Vercel automatically. The build runs prisma generate, applies any new migrations with prisma migrate deploy, then builds.

* Pushes to other branches / pull requests get **preview deployments** on temporary URLs — useful for testing before merging. Give previews their own env vars if you want them fully functional.

* To create a new migration locally, you still use the Docker workflow (docker compose exec app pnpm prisma migrate dev \--name \<change\>), commit the generated migration file, and let the next Vercel build apply it to production.

* Rollback: Vercel keeps previous deployments — you can instantly promote an older one from the dashboard if a deploy goes bad. (Note this does not roll back database migrations, only the app code.)

# **11\. Quick reference — the whole sequence**

32. Create managed Postgres (Neon/Vercel Postgres/Supabase), Frankfurt region. Copy pooled \+ direct connection strings.

33. Apply migrations to the cloud DB (prisma migrate deploy, or let the Vercel build do it).

34. Push the repo to GitHub; confirm pnpm build passes.

35. Create the Vercel project, import the repo, set region to Frankfurt.

36. Set the build command to generate \+ migrate deploy \+ build.

37. Add all environment variables (DATABASE\_URL, DIRECT\_URL, BETTER\_AUTH\_SECRET, BETTER\_AUTH\_URL, the three Turnstile vars, optional Sentry).

38. Create the Cloudflare Turnstile widget for oldtimers.online; fill in the keys.

39. Deploy; verify on the .vercel.app URL.

40. Add oldtimers.online (and www) in Vercel → Domains.

41. In SuperHosting Domain Management, change the apex A record to Vercel's IP and set the www CNAME to Vercel's target.

42. Wait for propagation; Vercel auto-issues HTTPS; confirm the site loads on the real domain.

43. Set BETTER\_AUTH\_URL to https://oldtimers.online if not already; redeploy.

44. Bootstrap the first admin; run the post-launch checklist (section 9).

*Prepared as a deployment runbook for Old Timer's. Always defer to the exact records and values shown in your own Vercel and database-provider dashboards — those are project-specific and override the generic examples here.*