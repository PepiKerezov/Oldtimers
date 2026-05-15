import Link from "next/link";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

const FACTS = [
  "Ретро автомобилите често са ръчно сглобени с уникални детайли.",
  "Оригиналните части понякога са по-ценни от самата кола.",
  "Историята на автомобила определя неговата стойност.",
];

export default async function HomePage() {
  const articles = await db.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
    },
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-[var(--color-burgundy-deep)] text-[var(--color-cream)]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <span className="inline-block rounded-full border border-[var(--color-cream)]/25 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-cream)]/85">
              Old Timer&apos;s
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl md:text-6xl leading-tight text-[var(--color-cream)]">
              Търсиш части за твоя ретро автомобил?
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-[var(--color-cream)]/75">
              Намери качествени части, редки компоненти и помощ за реставрация на
              класически автомобили – на едно място.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/order">Свържи се с нас</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-[var(--color-cream)]/40 text-[var(--color-cream)] hover:bg-[var(--color-cream)]/10 hover:text-[var(--color-cream)]"
              >
                <Link href="/articles">Научи повече</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20 grid md:grid-cols-2 gap-6">
          <article className="rounded-3xl bg-[var(--color-pink-50)] p-8 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
                Нашата история
              </p>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-card text-foreground hover:bg-card/85 shadow-sm"
              >
                <Link href="/about">Прочети</Link>
              </Button>
            </div>
            <h2 className="mt-6 text-2xl md:text-3xl">Историята на Old Timer&apos;s</h2>
            <p className="mt-4 text-foreground/75 max-w-md">
              Замисляли ли сте се кога за последно сте виждали ретро автомобил
              на улицата?
            </p>
          </article>

          <article className="rounded-3xl bg-[var(--color-pink-50)] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
              Интересно
            </p>
            <h2 className="mt-6 text-2xl md:text-3xl">Любопитни неща</h2>
            <ul className="mt-6 space-y-3">
              {FACTS.map((fact, i) => (
                <li
                  key={i}
                  className="rounded-2xl bg-card px-5 py-4 text-sm md:text-base text-foreground/80"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl md:text-3xl">Още теми</h2>
            <Button asChild variant="ghost">
              <Link href="/articles">Виж всички →</Link>
            </Button>
          </div>
          {articles.length > 0 ? (
            <ArticleGrid articles={articles} />
          ) : (
            <p className="text-foreground/60">
              Още няма публикувани статии. Очаквайте скоро.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
