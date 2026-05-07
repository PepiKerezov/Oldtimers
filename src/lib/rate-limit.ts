// In-memory rate limiter. Suitable for local dev / single-process prod.
// TODO: replace with Upstash Redis or similar when running multiple replicas.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetIn: existing.resetAt - now };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetIn: existing.resetAt - now,
  };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
