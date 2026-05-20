import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Направи запитване",
    body: "Разкажи ни за твоя автомобил и частта, която търсиш.",
  },
  {
    n: "02",
    title: "Консултация",
    body: "Обсъждаме варианти, съвместимост и какво наистина подхожда на твоя проект.",
  },
  {
    n: "03",
    title: "Оферта с гаранция",
    body: "Ясна цена за проверена част — качеството гарантирано писмено.",
  },
  {
    n: "04",
    title: "Улеснена доставка",
    body: "Изпращаме директно до теб. Това е всичко — готов си.",
  },
];

export function ProcessSteps() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 md:pt-20">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
          Как работи
        </p>
        <h2 className="mt-3 text-3xl md:text-4xl">Лесен процес</h2>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className="relative rounded-3xl border border-border bg-card p-6 md:p-7 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(92,26,27,0.25)]"
          >
            <span
              className="block font-serif text-5xl font-bold leading-none text-[var(--color-pink-200)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {step.n}
            </span>
            <h4 className="mt-4 text-lg leading-tight">{step.title}</h4>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              {step.body}
            </p>
            {i < STEPS.length - 1 && (
              <div className="absolute -right-3.5 top-12 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-background text-primary lg:flex">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/order">Направи поръчка</Link>
        </Button>
      </div>
    </section>
  );
}
