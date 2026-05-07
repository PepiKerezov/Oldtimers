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
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  RESEND_API_KEY: optional("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  TURNSTILE_SITE_KEY: optional("TURNSTILE_SITE_KEY"),
  TURNSTILE_SECRET_KEY: optional("TURNSTILE_SECRET_KEY"),
  ADMIN_EMAIL: required("ADMIN_EMAIL"),
  SENTRY_DSN: optional("SENTRY_DSN"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

export const isProd = env.NODE_ENV === "production";
export const isDev = !isProd;
