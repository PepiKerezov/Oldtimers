import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/articles";
import type { ArticleCategory } from "@prisma/client";

export type ArticleCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: ArticleCategory;
  publishedAt: Date | null;
};

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const date = article.publishedAt
    ? new Intl.DateTimeFormat("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(article.publishedAt)
    : null;

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-secondary/40 overflow-hidden">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-foreground/30 text-4xl font-serif">
            Old Timer&apos;s
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-2">
          {CATEGORY_LABELS[article.category]}
        </p>
        <h3 className="text-xl font-serif text-primary group-hover:text-primary/80 line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-foreground/75 line-clamp-3">{article.excerpt}</p>
        {date && (
          <p className="mt-4 text-xs text-foreground/55">{date}</p>
        )}
      </div>
    </Link>
  );
}
