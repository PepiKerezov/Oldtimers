"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { logger } from "@/lib/logger";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminSchema } from "@/lib/schemas/user";

export async function createAdminUser(
  input: unknown,
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAdmin();

    const parsed = createAdminSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Невалидни данни");
    }
    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) return fail("Вече съществува потребител с този имейл");

    // Admin-plugin endpoint — creates the user + credential account directly,
    // bypassing the disabled public sign-up. Headers carry the caller's
    // session so Better Auth re-verifies the `user:create` permission.
    const { user } = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        // This project uses uppercase roles (adminRoles: ["ADMIN"]); Better
        // Auth's default access-control types only know lowercase literals.
        role: "ADMIN" as unknown as "admin",
      },
      headers: await headers(),
    });

    logger.info(
      { targetId: user.id, by: session.user.id },
      "user.create_admin",
    );
    revalidatePath("/admin/users");
    return ok({ id: user.id });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "user.create_admin.failed");
    return fail("Грешка при създаване на администратор");
  }
}

export async function promoteToAdmin(userId: string): Promise<Result<null>> {
  try {
    const session = await requireAdmin();
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return fail("Потребителят не съществува");
    if (target.role === "ADMIN") return fail("Потребителят вече е администратор");

    await db.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
    logger.info(
      { targetId: userId, by: session.user.id },
      "user.promote",
    );
    revalidatePath("/admin/users");
    return ok(null);
  } catch (e) {
    logger.error({ err: (e as Error).message }, "user.promote.failed");
    return fail("Грешка при повишаване");
  }
}

export async function demoteToUser(userId: string): Promise<Result<null>> {
  try {
    const session = await requireAdmin();
    if (session.user.id === userId) {
      return fail("Не можеш да понижиш собствения си акаунт");
    }
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return fail("Потребителят не съществува");
    if (target.role !== "ADMIN") return fail("Потребителят не е администратор");

    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return fail("Не може да понижиш последния администратор");
    }

    await db.user.update({ where: { id: userId }, data: { role: "USER" } });
    logger.info({ targetId: userId, by: session.user.id }, "user.demote");
    revalidatePath("/admin/users");
    return ok(null);
  } catch (e) {
    logger.error({ err: (e as Error).message }, "user.demote.failed");
    return fail("Грешка при понижаване");
  }
}
