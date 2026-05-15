import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { MessageHandledToggle } from "@/components/admin/MessageHandledToggle";

export const metadata = { title: "Съобщение" };

export default async function AdminMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await db.contactSubmission.findUnique({ where: { id } });
  if (!message) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/messages"
        className="text-sm text-foreground/60 hover:text-primary"
      >
        ← Назад към съобщения
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-3">
          {message.handled ? (
            <Badge variant="outline">Обработено</Badge>
          ) : (
            <Badge>Ново</Badge>
          )}
          <p className="text-sm text-foreground/60">
            {new Intl.DateTimeFormat("bg-BG", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(message.createdAt)}
          </p>
        </div>
        <h1 className="text-3xl">{message.subject}</h1>
      </header>

      <section className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h2 className="text-lg font-medium mb-2">Подател</h2>
        <Field label="Име" value={message.name} />
        <Field
          label="Имейл"
          value={
            <a className="underline text-primary" href={`mailto:${message.email}`}>
              {message.email}
            </a>
          }
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium mb-3">Съобщение</h2>
        <p className="whitespace-pre-wrap break-words text-foreground/85 leading-relaxed">
          {message.message}
        </p>
      </section>

      <div className="flex justify-end">
        <MessageHandledToggle id={message.id} handled={message.handled} />
      </div>
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
