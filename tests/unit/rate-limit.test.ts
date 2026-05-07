import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to N requests then blocks", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 1000).ok).toBe(true);
    }
    expect(rateLimit(key, 3, 1000).ok).toBe(false);
  });

  it("isolates different keys", () => {
    const a = `test:${Math.random()}:a`;
    const b = `test:${Math.random()}:b`;
    rateLimit(a, 1, 1000);
    expect(rateLimit(a, 1, 1000).ok).toBe(false);
    expect(rateLimit(b, 1, 1000).ok).toBe(true);
  });
});
