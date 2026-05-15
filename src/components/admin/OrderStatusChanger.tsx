"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/server/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LABELS: Record<OrderStatus, string> = {
  NEW: "Нова",
  FINDING: "Търся",
  DONE: "Изпълнена",
  REFUSED: "Отказана",
};

export function OrderStatusChanger({
  id,
  current,
}: {
  id: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: OrderStatus) {
    if (next === value) return;
    setValue(next);
    startTransition(async () => {
      const r = await updateOrderStatus(id, next);
      if (!r.success) {
        toast.error(r.error);
        setValue(current);
        return;
      }
      toast.success("Статусът е обновен");
      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={(v) => handleChange(v as OrderStatus)} disabled={isPending}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LABELS).map(([k, label]) => (
          <SelectItem key={k} value={k}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
