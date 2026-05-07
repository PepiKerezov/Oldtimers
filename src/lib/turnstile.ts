import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("TURNSTILE_SECRET_KEY missing — bypassing in dev");
      return true;
    }
    return false;
  }
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    logger.error({ err: (e as Error).message }, "turnstile.verify.failed");
    return false;
  }
}
