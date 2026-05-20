import { Search, UserRound, BadgeCheck, Truck } from "lucide-react";

const SERVICES = [
  {
    icon: Search,
    title: "Търсим части специално за твоя автомобил",
    body: "Откриваме конкретната част за твоя модел — без догадки и без универсални заместители.",
  },
  {
    icon: UserRound,
    title: "Индивидуален подход",
    body: "Лична консултация — опознаваме твоя проект и адаптираме всяка препоръка спрямо него.",
  },
  {
    icon: BadgeCheck,
    title: "Гаранция за качество с VIN",
    body: "Всяка част се проверява по VIN номера — това, което получаваш, точно пасва.",
  },
  {
    icon: Truck,
    title: "Улеснена доставка без грижи",
    body: "Доставка до врата в цяла България. Ние се грижим за логистиката — ти за колата.",
  },
];

export function ServicesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 md:pt-20">
      <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
        Направи поръчка
      </p>
      <h2 className="mt-3 text-3xl md:text-4xl">Специализирано обслужване</h2>
      <p className="mt-3 max-w-xl text-foreground/70">
        Всичко, от което се нуждае твоят класически автомобил — от хора, които
        наистина разбират от тези коли.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-3xl border border-border bg-card p-6 md:p-7 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(92,26,27,0.25)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-pink-50)] text-primary">
              <Icon className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h3 className="mt-5 text-lg leading-tight">{title}</h3>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
