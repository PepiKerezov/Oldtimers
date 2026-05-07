import { describe, expect, it } from "vitest";
import { slugify, CATEGORY_LABELS } from "@/lib/articles";

describe("slugify", () => {
  it("transliterates Cyrillic", () => {
    expect(slugify("История на Old Timer's")).toBe("istoriya-na-old-timers");
  });

  it("handles diacritics and punctuation", () => {
    expect(slugify("Защо ретро автомобилите!")).toBe("zashto-retro-avtomobilite");
  });

  it("collapses whitespace and dashes", () => {
    expect(slugify("hello   world --")).toBe("hello-world");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("limits to 80 chars", () => {
    const out = slugify("a".repeat(100));
    expect(out.length).toBeLessThanOrEqual(80);
  });
});

describe("CATEGORY_LABELS", () => {
  it("has Bulgarian labels for all categories", () => {
    expect(CATEGORY_LABELS.novini).toBe("Новини");
    expect(CATEGORY_LABELS.istoriya).toBe("История");
    expect(CATEGORY_LABELS.lyubopitni).toBe("Любопитни");
    expect(CATEGORY_LABELS.saveti).toBe("Съвети");
  });
});
