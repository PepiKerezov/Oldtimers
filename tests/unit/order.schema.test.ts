import { describe, expect, it } from "vitest";
import { orderInputSchema, phoneRegex } from "@/lib/schemas/order";

const valid = {
  carMake: "Mercedes-Benz",
  carModel: "W123 200D",
  carYear: 1985,
  partDesc: "Търся оригинална предна решетка с лого, не репродукция.",
  customerName: "Иван Иванов",
  email: "ivan@example.com",
  phone: "+359888123456",
  notes: "",
  turnstileToken: "tok",
};

describe("orderInputSchema", () => {
  it("accepts valid input", () => {
    const r = orderInputSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects short carMake", () => {
    const r = orderInputSchema.safeParse({ ...valid, carMake: "M" });
    expect(r.success).toBe(false);
  });

  it("rejects future carYear", () => {
    const r = orderInputSchema.safeParse({
      ...valid,
      carYear: new Date().getFullYear() + 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects pre-1900 carYear", () => {
    const r = orderInputSchema.safeParse({ ...valid, carYear: 1899 });
    expect(r.success).toBe(false);
  });

  it("rejects partDesc shorter than 10", () => {
    const r = orderInputSchema.safeParse({ ...valid, partDesc: "a" });
    expect(r.success).toBe(false);
  });

  it("requires turnstile token", () => {
    const r = orderInputSchema.safeParse({ ...valid, turnstileToken: "" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = orderInputSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(r.success).toBe(false);
  });
});

describe("phoneRegex", () => {
  it.each([
    "+359888123456",
    "+35988812345",
    "0888123456",
    "088812345",
  ])("accepts %s", (phone) => {
    expect(phoneRegex.test(phone)).toBe(true);
  });

  it.each([
    "+1234567890",
    "888123456",
    "+359abc12345",
    "+359 888 123 456",
    "0888-123-456",
  ])("rejects %s", (phone) => {
    expect(phoneRegex.test(phone)).toBe(false);
  });
});
