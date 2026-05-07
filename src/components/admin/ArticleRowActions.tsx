"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteArticle, togglePublish } from "@/server/articles";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ArticleRowActions({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      const r = await togglePublish(id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(r.data.published ? "Публикувана" : "Скрита");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteArticle(id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Изтрита");
      setConfirmDelete(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/articles/${id}/edit`}>Редакция</Link>
      </Button>
      <Button
        onClick={handleToggle}
        disabled={isPending}
        variant="outline"
        size="sm"
      >
        {published ? "Скрий" : "Публикувай"}
      </Button>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive">
            Изтрий
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на статия</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие е необратимо. Сигурен ли си?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
