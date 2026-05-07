export const metadata = {
  title: "За нас",
  description:
    "Old Timer's намира оригинални части за класически автомобили, с експертна консултация и доказан произход.",
};

const VALUES = [
  {
    title: "Оригиналност",
    body: "Никога не продаваме репродукция за оригинал.",
  },
  { title: "Качество", body: "Всяка част минава през проверка, преди да тръгне към теб." },
  { title: "Експертиза", body: "Ти получаваш съвет, не само артикул." },
  { title: "Прозрачност", body: "Знаеш откъде идва частта и защо струва толкова." },
  { title: "Устойчивост", body: "Старите коли заслужават нов живот." },
];

const TEAM = [
  { name: "Христо", role: "CEO. Контрол и участие във всеки процес." },
  { name: "Иван", role: "CPO (Head of Procurement). Снабдяване с части; гарант за оригиналност." },
  { name: "Димитър", role: "CFO. Финанси и бюджет." },
  { name: "Кристина", role: "CCO (Head of Customer Service). Връзка с клиенти." },
  { name: "Александър", role: "CMO. Маркетинг и комуникация." },
  { name: "Петър", role: "CTO. Сайт и технологии." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
        За нас
      </p>
      <h1 className="text-4xl md:text-5xl mb-6">
        Експертиза за хора, които се грижат за ретро автомобилите си
      </h1>

      <section className="mt-10 space-y-8 text-foreground/85 text-lg leading-relaxed">
        <div>
          <h2 className="text-2xl mb-3">Историята ни</h2>
          <p>
            Old Timer&apos;s започна от един простичък проблем: в България и
            региона е почти невъзможно да намериш качествени части за класически
            автомобил. Малко доставчици, непрозрачни обяви, рискове за
            оригиналност. Ние решихме да направим обратното — едно място, в
            което собствениците на ретро коли получават експертна помощ от хора,
            които наистина разбират от темата.
          </p>
        </div>

        <div>
          <h2 className="text-2xl mb-3">Какво правим</h2>
          <p>
            Old Timer&apos;s е специализиран в намирането на автентични части за
            ретро автомобили в България. Знаем колко трудно е да откриеш точно
            тази част — рядка, специфична за модела, със съмнителен произход на
            половината обяви онлайн. Тук идваме ние: работим с морги в Западна
            Европа, с производители на оригинални компоненти като Schmiedmann и
            с местни доставчици.
          </p>
        </div>

        <div>
          <h2 className="text-2xl mb-3">Как работим</h2>
          <p>
            Всяка поръчка минава през личен контакт. Свързваш се с нас — по
            телефон, имейл или през формата „Търси част&ldquo; — и ние тръгваме
            да я намерим. Получаваш консултация преди покупка, документация за
            произхода на частта и доставка през Speedy или Econt до твоя адрес.
            Без загадъчни съобщения, без шаблонни отговори.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl mb-6">Ценности</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {VALUES.map((v, i) => (
            <li
              key={v.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-serif text-xl text-primary mt-1">{v.title}</h3>
              <p className="mt-2 text-foreground/80">{v.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl mb-6">Екип</h2>
        <ul className="grid sm:grid-cols-2 gap-4">
          {TEAM.map((t) => (
            <li
              key={t.name}
              className="rounded-xl border border-border bg-card p-5"
            >
              <p className="font-serif text-xl text-primary">{t.name}</p>
              <p className="mt-1 text-sm text-foreground/75">{t.role}</p>
            </li>
          ))}
        </ul>
      </section>

      <blockquote className="mt-16 border-l-4 border-primary pl-6 italic text-foreground/75">
        „The best tunes are played on the oldest fiddles.&ldquo;
        <footer className="mt-2 text-sm not-italic text-foreground/60">
          — Ralph Waldo Emerson
        </footer>
      </blockquote>
    </div>
  );
}
