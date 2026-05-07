"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { articleInputSchema, type ArticleInput } from "@/lib/schemas/article";
import { slugify } from "@/lib/articles";
import { logger } from "@/lib/logger";
import { fail, ok, type Result } from "@/lib/result";

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let n = 1;
  while (true) {
    const existing = await db.article.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

export async function createArticle(
  input: ArticleInput,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = articleInputSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Невалидни данни");

    const baseSlug = parsed.data.slug || slugify(parsed.data.title);
    const slug = await ensureUniqueSlug(baseSlug);

    const article = await db.article.create({
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        category: parsed.data.category,
        coverImage: parsed.data.coverImage || null,
        content: (parsed.data.content as object) ?? { type: "doc", content: [] },
        published: false,
        authorId: session.user.id,
      },
    });
    logger.info({ articleId: article.id, by: session.user.id }, "article.create");
    revalidatePath("/admin/articles");
    revalidatePath("/articles");
    revalidatePath("/");
    return ok({ id: article.id, slug: article.slug });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "article.create.failed");
    return fail("Не успяхме да създадем статията");
  }
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
): Promise<Result<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const parsed = articleInputSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Невалидни данни");

    const slug = await ensureUniqueSlug(parsed.data.slug, id);

    const article = await db.article.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        category: parsed.data.category,
        coverImage: parsed.data.coverImage || null,
        content: (parsed.data.content as object) ?? { type: "doc", content: [] },
      },
    });
    revalidatePath("/admin/articles");
    revalidatePath("/articles");
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/");
    return ok({ id: article.id, slug: article.slug });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "article.update.failed");
    return fail("Не успяхме да обновим статията");
  }
}

export async function togglePublish(id: string): Promise<Result<{ published: boolean }>> {
  try {
    await requireAdmin();
    const current = await db.article.findUnique({ where: { id } });
    if (!current) return fail("Статията не съществува");
    const updated = await db.article.update({
      where: { id },
      data: {
        published: !current.published,
        publishedAt: !current.published ? new Date() : current.publishedAt,
      },
    });
    revalidatePath("/admin/articles");
    revalidatePath("/articles");
    revalidatePath(`/articles/${updated.slug}`);
    revalidatePath("/");
    return ok({ published: updated.published });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "article.togglePublish.failed");
    return fail("Грешка при смяна на статус");
  }
}

export async function deleteArticle(id: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    await db.article.delete({ where: { id } });
    revalidatePath("/admin/articles");
    revalidatePath("/articles");
    revalidatePath("/");
    return ok(null);
  } catch (e) {
    logger.error({ err: (e as Error).message }, "article.delete.failed");
    return fail("Грешка при изтриване");
  }
}
