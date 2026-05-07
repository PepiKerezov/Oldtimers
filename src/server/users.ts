"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { logger } from "@/lib/logger";
import { fail, ok, type Result } from "@/lib/result";

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
