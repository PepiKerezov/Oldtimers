import { ArticleCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  novini: "Новини",
  istoriya: "История",
  lyubopitni: "Любопитни",
  saveti: "Съвети",
};

export const CATEGORY_OPTIONS: { value: ArticleCategory; label: string }[] = (
  Object.entries(CATEGORY_LABELS) as [ArticleCategory, string][]
).map(([value, label]) => ({ value, label }));

const CYRILLIC_TRANSLITERATION: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y",
  ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .split("")
    .map((c) => CYRILLIC_TRANSLITERATION[c] ?? c)
    .join("")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
