import { z } from "zod";
import { ArticleCategory } from "@prisma/client";

export const articleCategoryEnum = z.nativeEnum(ArticleCategory);

export const articleInputSchema = z.object({
  title: z.string().min(3, "Поне 3 знака").max(160),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Само малки латински букви, цифри и тирета"),
  excerpt: z.string().min(10, "Поне 10 знака").max(400),
  category: articleCategoryEnum,
  coverImage: z
    .union([
      z.string().url(),
      z.string().regex(/^\/api\/images\/[a-z0-9]+$/i, "Невалиден път"),
      z.literal(""),
    ])
    .optional(),
  content: z.unknown(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
