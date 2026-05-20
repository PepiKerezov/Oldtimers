import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArticleForm } from "@/components/forms/ArticleForm";
import { ArticleEditActions } from "@/components/admin/ArticleEditActions";

export const metadata = { title: "Редакция на статия" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl">Редакция: {article.title}</h1>
        <ArticleEditActions id={article.id} published={article.published} />
      </div>
      <ArticleForm
        mode="edit"
        initial={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          category: article.category,
          coverImage: article.coverImage,
          content: article.content,
        }}
      />
    </div>
  );
}
