import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/articles";
import { ArticleRowActions } from "@/components/admin/ArticleRowActions";

export const metadata = { title: "Статии" };
export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await db.article.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Статии</h1>
          <p className="text-foreground/70">{articles.length} общо</p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">+ Нова статия</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заглавие</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Обновена</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/60 py-10">
                  Все още нямаш статии.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="hover:text-primary"
                    >
                      {a.title}
                    </Link>
                  </TableCell>
                  <TableCell>{CATEGORY_LABELS[a.category]}</TableCell>
                  <TableCell>
                    {a.published ? (
                      <Badge variant="default">Публикувана</Badge>
                    ) : (
                      <Badge variant="outline">Чернова</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground/70">
                    {new Intl.DateTimeFormat("bg-BG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(a.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ArticleRowActions id={a.id} published={a.published} />
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
