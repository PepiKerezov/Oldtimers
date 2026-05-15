"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orderInputSchema, type OrderInput } from "@/lib/schemas/order";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { fail, ok, type Result } from "@/lib/result";
import { requireAdmin } from "@/lib/session";
import type { OrderStatus } from "@prisma/client";

export async function submitOrder(
  input: OrderInput,
): Promise<Result<{ id: string }>> {
  const h = await headers();
  const ip = getClientIp(h);

  const limit = rateLimit(`order:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return fail("Прекалено много опити. Опитай след малко.");
  }

  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Невалидни данни");
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) return fail("Не успяхме да потвърдим, че не си робот");

  try {
    const order = await db.order.create({
      data: {
        carMake: parsed.data.carMake,
        carModel: parsed.data.carModel,
        carYear: parsed.data.carYear,
        partDesc: parsed.data.partDesc,
        customerName: parsed.data.customerName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        notes: parsed.data.notes || null,
        ipAddress: ip,
      },
    });

    logger.info({ orderId: order.id }, "order.created");

    return ok({ id: order.id });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "order.create.failed");
    return fail("Възникна грешка. Моля опитай отново.");
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Result<null>> {
  try {
    await requireAdmin();
    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) return fail("Поръчката не е намерена");
    if (existing.status === status) {
      return ok(null);
    }

    await db.order.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);

    return ok(null);
  } catch (e) {
    logger.error({ err: (e as Error).message }, "order.updateStatus.failed");
    return fail("Грешка при смяна на статус");
  }
}
