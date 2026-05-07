import { describe, expect, it } from "vitest";
import { contactInputSchema } from "@/lib/schemas/contact";

const valid = {
  name: "Иван Иванов",
  email: "ivan@example.com",
  message: "Имам въпрос за части за W123, благодаря.",
  turnstileToken: "tok",
};

describe("contactInputSchema", () => {
  it("accepts valid input", () => {
    expect(contactInputSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["name too short", { ...valid, name: "A" }],
    ["bad email", { ...valid, email: "nope" }],
    ["message too short", { ...valid, message: "hi" }],
    ["empty turnstile", { ...valid, turnstileToken: "" }],
  ])("rejects: %s", (_label, input) => {
    expect(contactInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects message over 2000 chars", () => {
    const r = contactInputSchema.safeParse({
      ...valid,
      message: "a".repeat(2001),
    });
    expect(r.success).toBe(false);
  });
});
