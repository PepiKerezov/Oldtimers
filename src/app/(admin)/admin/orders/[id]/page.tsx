import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OrderStatusChanger } from "@/components/admin/OrderStatusChanger";

export const metadata = { title: "Детайли на поръчка" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-foreground/60 hover:text-primary">
        ← Назад към поръчки
      </Link>

      <header>
        <h1 className="text-3xl mb-1">
          {order.carMake} {order.carModel} ({order.carYear})
        </h1>
        <p className="text-foreground/70">
          Поръчка #{order.id.slice(0, 8)} ·{" "}
          {new Intl.DateTimeFormat("bg-BG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(order.createdAt)}
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium mb-4">Статус</h2>
        <OrderStatusChanger id={order.id} current={order.status} />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h2 className="text-lg font-medium mb-2">Клиент</h2>
        <Field label="Име" value={order.customerName} />
        <Field
          label="Имейл"
          value={
            <a className="underline text-primary" href={`mailto:${order.email}`}>
              {order.email}
            </a>
          }
        />
        <Field
          label="Телефон"
          value={
            <a className="underline text-primary" href={`tel:${order.phone}`}>
              {order.phone}
            </a>
          }
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium mb-2">Описание на частта</h2>
        <p className="whitespace-pre-wrap text-foreground/85">{order.partDesc}</p>
        {order.notes && (
          <>
            <h3 className="text-sm uppercase tracking-[0.2em] text-foreground/60 mt-4 mb-2">
              Бележки
            </h3>
            <p className="whitespace-pre-wrap text-foreground/85">{order.notes}</p>
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-foreground/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}
