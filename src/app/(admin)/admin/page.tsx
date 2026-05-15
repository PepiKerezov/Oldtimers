import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Администрация" };

export default async function AdminDashboardPage() {
  const [articles, draftArticles, orders, openOrders, messages, unhandledMessages, admins] =
    await Promise.all([
      db.article.count(),
      db.article.count({ where: { published: false } }),
      db.order.count(),
      db.order.count({ where: { status: { in: ["NEW", "FINDING"] } } }),
      db.contactSubmission.count(),
      db.contactSubmission.count({ where: { handled: false } }),
      db.user.count({ where: { role: "ADMIN" } }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl mb-1">Администрация</h1>
        <p className="text-foreground/70">Преглед на дейността по сайта.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Статии" value={articles} note={`${draftArticles} в чернова`} />
        <StatCard title="Поръчки" value={orders} note={`${openOrders} активни`} />
        <StatCard title="Съобщения" value={messages} note={`${unhandledMessages} нови`} />
        <StatCard title="Администратори" value={admins} note="" />
      </div>
    </div>
  );
}

function StatCard({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-serif text-primary">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-foreground/70">{note}</CardContent>
    </Card>
  );
}
