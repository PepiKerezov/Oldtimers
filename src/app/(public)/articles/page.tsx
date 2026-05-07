import Link from "next/link";
import { db } from "@/lib/db";
import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { CATEGORY_LABELS } from "@/lib/articles";
import { ArticleCategory, type Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Статии",
  description: "Статии и експертни мнения за ретро автомобили и техните части.",
};

const PAGE_SIZE = 9;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = (
    Object.values(ArticleCategory).includes(params.category as ArticleCategory)
      ? (params.category as ArticleCategory)
      : undefined
  );
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.ArticleWhereInput = {
    published: true,
    ...(category ? { category } : {}),
  };

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
    }),
    db.article.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
          Журналът на Old Timer&apos;s
        </p>
        <h1 className="text-4xl md:text-5xl mb-4">Статии</h1>
        <p className="text-foreground/75 max-w-2xl">
          Експертни мнения, истории за части и съвети за хора, които се грижат за
          ретро автомобилите си.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 mb-10">
        <CategoryLink active={!category} href="/articles" label="Всички" />
        {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
          <CategoryLink
            key={slug}
            active={category === slug}
            href={`/articles?category=${slug}`}
            label={label}
          />
        ))}
      </nav>

      {articles.length === 0 ? (
        <p className="text-foreground/60">Все още няма статии в тази категория.</p>
      ) : (
        <>
          <ArticleGrid articles={articles} />
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const url = new URLSearchParams();
                if (category) url.set("category", category);
                if (p > 1) url.set("page", String(p));
                const href = `/articles${url.toString() ? `?${url.toString()}` : ""}`;
                return (
                  <Link
                    key={p}
                    href={href}
                    className={cn(
                      "px-3 py-1 rounded border text-sm",
                      p === page
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border bg-card hover:border-primary hover:text-primary",
      )}
    >
      {label}
    </Link>
  );
}
