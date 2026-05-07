import { ContactForm } from "@/components/forms/ContactForm";

export const metadata = {
  title: "Контакти",
  description:
    "Свържи се с нас за части за класически автомобили — отговаряме лично, обикновено в рамките на работния ден.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
        Контакти
      </p>
      <h1 className="text-4xl md:text-5xl mb-4">Свържи се с нас</h1>
      <p className="text-foreground/75 max-w-2xl mb-12">
        Имаш ретро автомобил, на който търсиш част? Пиши ни или се обади —
        отговаряме лично, обикновено в рамките на работния ден.
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          {/* TODO: replace placeholders with real contact info before launch */}
          <ContactItem label="Имейл" value="по заявка" hint="ще бъде попълнен преди старта" />
          <ContactItem label="Телефон" value="по заявка" />
          <ContactItem
            label="Адрес"
            value="по заявка"
            hint="работим основно онлайн с доставка чрез Speedy / Econt"
          />
          <ContactItem
            label="Работно време"
            value="Понеделник – Петък, 10:00 – 18:00"
          />
          <p className="text-sm text-foreground/65 pt-4">
            За специфични запитвания за части използвай формата{" "}
            <a className="underline text-primary" href="/order">
              „Поръчай част&ldquo;
            </a>{" "}
            — описваш марка, модел, година и какво ти трябва, ние се връщаме с
            предложения.
          </p>
        </div>
        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

function ContactItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">{label}</p>
      <p className="mt-1 text-lg">{value}</p>
      {hint && <p className="text-sm text-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}
