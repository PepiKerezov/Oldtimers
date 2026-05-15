import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageHandledToggle } from "@/components/admin/MessageHandledToggle";

export const metadata = { title: "Съобщения" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await db.contactSubmission.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Съобщения</h1>
        <p className="text-foreground/70">{messages.length} в текущия изглед</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Получено</TableHead>
              <TableHead>От</TableHead>
              <TableHead>Тема</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/60 py-10">
                  Няма съобщения.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-foreground/70 whitespace-nowrap">
                    {new Intl.DateTimeFormat("bg-BG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-foreground/60">
                      <a className="underline" href={`mailto:${m.email}`}>
                        {m.email}
                      </a>
                    </p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <Link
                      href={`/admin/messages/${m.id}`}
                      className="font-medium underline-offset-2 hover:underline hover:text-primary"
                    >
                      {m.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {m.handled ? (
                      <Badge variant="outline">Обработено</Badge>
                    ) : (
                      <Badge>Ново</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MessageHandledToggle id={m.id} handled={m.handled} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
