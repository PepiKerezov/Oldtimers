import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  if (session.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user?.role === "ADMIN";
}
