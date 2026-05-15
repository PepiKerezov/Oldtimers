import { ContactForm } from "@/components/forms/ContactForm";

export const metadata = {
  title: "Контакти",
  description:
    "Свържи се с нас за части за класически автомобили — отговаряме лично, обикновено в рамките на работния ден.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
        Контакти
      </p>
      <h1 className="text-4xl md:text-5xl mb-4">Свържи се с нас</h1>
      <p className="text-foreground/75 mb-12">
        Имаш ретро автомобил, на който търсиш част? Пиши ни — отговаряме лично,
        обикновено в рамките на работния ден.
      </p>

      <ContactForm />
    </div>
  );
}
