import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

// Better Auth rejects auth requests whose Origin isn't trusted. Accept both the
// apex and the www host of BETTER_AUTH_URL so a visitor on either one can log in
// regardless of which domain Vercel served the page from.
function authTrustedOrigins(base: string): string[] {
  try {
    const u = new URL(base);
    const apex = u.host.replace(/^www\./, "");
    return [`${u.protocol}//${apex}`, `${u.protocol}//www.${apex}`];
  } catch {
    return [base];
  }
}

export const auth = betterAuth({
  appName: "Old Timer's",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    disableSignUp: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {},
  },
  plugins: [
    admin({
      defaultRole: "USER",
      adminRoles: ["ADMIN"],
    }),
  ],
  trustedOrigins: authTrustedOrigins(env.BETTER_AUTH_URL),
});

export type Auth = typeof auth;
