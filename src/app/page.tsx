import Link from "next/link";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

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
        <section className="prose-bg">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="uppercase tracking-[0.2em] text-sm text-[var(--accent-foreground)]/70 mb-4">
                Old Timer&apos;s
              </p>
              <h1 className="text-4xl md:text-6xl leading-tight">
                Търсиш части за твоя ретро автомобил?
              </h1>
              <p className="mt-6 text-lg text-foreground/80 max-w-xl">
                Намираме оригинални и качествени части — от морги в Западна Европа,
                от проверени производители и от мрежа от ентусиасти, която изграждаме
                от години.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/order">Свържи се с нас</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/articles">Научи повече</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-cadillac-illustration.svg"
                alt="Класически автомобил Cadillac"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-cadillac.png"
              alt="Old Timer's екип"
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
              Нашата история
            </p>
            <h2 className="text-3xl md:text-4xl mb-4">
              Експертиза, която ти помага да намериш точно тази част
            </h2>
            <p className="text-foreground/80 mb-6">
              Old Timer&apos;s е специализиран в намирането на автентични части за
              ретро автомобили в България. Работим с морги в Западна Европа, с
              производители на оригинални компоненти и с местни доставчици — за да
              гарантираме, че всяка част е оригинална, качествена и подходяща точно
              за твоя автомобил.
            </p>
            <Button asChild variant="outline">
              <Link href="/about">Прочети</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
              Любопитни неща
            </p>
            <h2 className="text-3xl md:text-4xl mb-10 max-w-2xl">
              Защо ретро автомобилите остават специални
            </h2>
            <ul className="grid md:grid-cols-3 gap-6">
              {[
                "Ретро автомобилите често са ръчно сглобени с уникални детайли.",
                "Оригиналните части понякога са по-ценни от самата кола.",
                "Историята на автомобила определя неговата стойност.",
              ].map((fact, i) => (
                <li
                  key={i}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <span className="text-3xl font-serif text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 text-foreground/85">{fact}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
                Още теми
              </p>
              <h2 className="text-3xl md:text-4xl">От нашия журнал</h2>
            </div>
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
