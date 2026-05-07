import { OrderForm } from "@/components/forms/OrderForm";

export const metadata = {
  title: "Поръчай част",
  description: "Опиши какво търсиш и ще се свържем с теб с предложение и цена.",
};

export default function OrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
        Поръчай част
      </p>
      <h1 className="text-4xl md:text-5xl mb-4">Какво търсиш?</h1>
      <p className="text-foreground/75 mb-12 max-w-2xl">
        Попълни формата и ще проверим при доставчиците ни. Отговор обикновено
        получаваш в рамките на 1–2 работни дни — с конкретна наличност, цена и
        срок за доставка.
      </p>
      <OrderForm />
    </div>
  );
}
