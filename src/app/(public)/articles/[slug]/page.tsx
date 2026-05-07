import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/articles";
import { TiptapRenderer } from "@/components/editor/TiptapRenderer";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImage: true, published: true },
  });
  if (!article || !article.published) return { title: "Не е намерено" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    include: { author: { select: { name: true, email: true } } },
  });
  if (!article || !article.published) notFound();

  const date = article.publishedAt
    ? new Intl.DateTimeFormat("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(article.publishedAt)
    : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/articles"
        className="text-sm text-foreground/60 hover:text-primary"
      >
        ← Назад към статии
      </Link>
      <header className="mt-6 mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
          {CATEGORY_LABELS[article.category]}
        </p>
        <h1 className="text-4xl md:text-5xl">{article.title}</h1>
        <p className="mt-4 text-lg text-foreground/75">{article.excerpt}</p>
        <div className="mt-6 text-sm text-foreground/60 flex flex-wrap gap-3">
          {date && <span>{date}</span>}
          {article.author?.name && (
            <>
              <span>•</span>
              <span>{article.author.name}</span>
            </>
          )}
        </div>
      </header>
      {article.coverImage && (
        <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-10 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <TiptapRenderer content={article.content} />
    </article>
  );
}
