function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  // Non-pooled connection string. Optional: only used by `prisma migrate
  // deploy` at build time (see prisma.config.ts). Runtime never reads it.
  DIRECT_URL: optional("DIRECT_URL"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  // Public origin. MUST be set explicitly in production (e.g.
  // https://oldtimers.online) — wrong value breaks auth cookies/redirects.
  // The localhost fallback exists only so local Docker dev boots without it.
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  TURNSTILE_SITE_KEY: optional("TURNSTILE_SITE_KEY"),
  TURNSTILE_SECRET_KEY: optional("TURNSTILE_SECRET_KEY"),
  SENTRY_DSN: optional("SENTRY_DSN"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

export const isProd = env.NODE_ENV === "production";
export const isDev = !isProd;
