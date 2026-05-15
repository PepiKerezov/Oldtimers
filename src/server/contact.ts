"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contactInputSchema, type ContactInput } from "@/lib/schemas/contact";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { fail, ok, type Result } from "@/lib/result";
import { requireAdmin } from "@/lib/session";

export async function submitContact(
  input: ContactInput,
): Promise<Result<{ id: string }>> {
  const h = await headers();
  const ip = getClientIp(h);

  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return fail("Прекалено много опити. Опитай след малко.");

  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Невалидни данни");
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) return fail("Не успяхме да потвърдим, че не си робот");

  try {
    const submission = await db.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        ipAddress: ip,
      },
    });
    logger.info({ id: submission.id }, "contact.created");

    return ok({ id: submission.id });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "contact.create.failed");
    return fail("Възникна грешка. Опитай отново.");
  }
}

export async function toggleContactHandled(
  id: string,
): Promise<Result<{ handled: boolean }>> {
  try {
    await requireAdmin();
    const current = await db.contactSubmission.findUnique({ where: { id } });
    if (!current) return fail("Не е намерено");
    const updated = await db.contactSubmission.update({
      where: { id },
      data: { handled: !current.handled },
    });
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${id}`);
    return ok({ handled: updated.handled });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "contact.toggle.failed");
    return fail("Грешка");
  }
}
