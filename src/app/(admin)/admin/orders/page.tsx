import Link from "next/link";
import { db } from "@/lib/db";
import { OrderStatus, type Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusFilter } from "@/components/admin/OrderStatusFilter";

export const metadata = { title: "Поръчки" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Нова",
  CONTACTED: "Свързах се",
  SOURCING: "Търся",
  QUOTED: "Оферта",
  COMPLETED: "Изпълнена",
  CANCELLED: "Отказана",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "default",
  CONTACTED: "secondary",
  SOURCING: "secondary",
  QUOTED: "secondary",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = (Object.values(OrderStatus).includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined);

  const where: Prisma.OrderWhereInput = status ? { status } : {};
  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Поръчки</h1>
        <p className="text-foreground/70">{orders.length} в текущия изглед</p>
      </div>

      <OrderStatusFilter current={status ?? "all"} />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Постъпила</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Автомобил</TableHead>
              <TableHead>Част</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/60 py-10">
                  Няма поръчки.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-foreground/70 whitespace-nowrap">
                    {new Intl.DateTimeFormat("bg-BG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {o.customerName}
                    </Link>
                    <p className="text-xs text-foreground/60">{o.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {o.carMake} {o.carModel} ({o.carYear})
                  </TableCell>
                  <TableCell className="max-w-md text-sm text-foreground/80 line-clamp-2">
                    {o.partDesc}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[o.status]}>
                      {STATUS_LABEL[o.status]}
                    </Badge>
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

export { STATUS_LABEL };
