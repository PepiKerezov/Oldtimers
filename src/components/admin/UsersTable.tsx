"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { promoteToAdmin, demoteToUser } from "@/server/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  providers: string[];
};

const PROVIDER_LABEL: Record<string, string> = {
  credential: "имейл",
  "email-password": "имейл",
  google: "Google",
};

export function UsersTable({
  users,
  currentUserId,
  filter,
  q,
}: {
  users: Row[];
  currentUserId: string;
  filter: "all" | "admins" | "users";
  q: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(q);
  const [confirm, setConfirm] = useState<{
    action: "promote" | "demote";
    user: Row;
  } | null>(null);

  function applyFilters(next: Partial<{ q: string; filter: string }>) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? search;
    const nextFilter = next.filter ?? filter;
    if (nextQ) params.set("q", nextQ);
    if (nextFilter !== "all") params.set("filter", nextFilter);
    router.push(`/admin/users${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleConfirm() {
    if (!confirm) return;
    const { action, user } = confirm;
    startTransition(async () => {
      const r =
        action === "promote"
          ? await promoteToAdmin(user.id)
          : await demoteToUser(user.id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(action === "promote" ? "Повишен до администратор" : "Понижен");
      setConfirm(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({ q: search });
          }}
          className="flex items-center gap-2 flex-1 max-w-md"
        >
          <Input
            placeholder="Търси по имейл или име"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline">Търси</Button>
        </form>
        <Select value={filter} onValueChange={(v) => applyFilters({ filter: v })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всички</SelectItem>
            <SelectItem value="admins">Само администратори</SelectItem>
            <SelectItem value="users">Само потребители</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имейл</TableHead>
              <TableHead>Име</TableHead>
              <TableHead>Метод</TableHead>
              <TableHead>Роля</TableHead>
              <TableHead>Създаден</TableHead>
              <TableHead className="text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground/60 py-10">
                  Няма потребители
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isMe = u.id === currentUserId;
                const isAdmin = u.role === "ADMIN";
                return (
                  <TableRow
                    key={u.id}
                    className={cn(isMe && "bg-secondary/30")}
                  >
                    <TableCell className="font-medium">
                      {u.email}
                      {isMe && (
                        <Badge variant="outline" className="ml-2">
                          ти
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.name ?? "—"}</TableCell>
                    <TableCell className="text-foreground/70">
                      {u.providers
                        .map((p) => PROVIDER_LABEL[p] ?? p)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge className="bg-primary text-primary-foreground">
                          Администратор
                        </Badge>
                      ) : (
                        <Badge variant="outline">Потребител</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground/70">
                      {new Intl.DateTimeFormat("bg-BG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isMe || isPending}
                          onClick={() => setConfirm({ action: "demote", user: u })}
                        >
                          Понижи
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => setConfirm({ action: "promote", user: u })}
                        >
                          Повиши
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "promote"
                ? "Повишаване до администратор"
                : "Понижаване до потребител"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "promote"
                ? `${confirm.user.email} ще получи администраторски права веднага.`
                : `${confirm?.user.email} ще загуби администраторските си права.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              Потвърди
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
