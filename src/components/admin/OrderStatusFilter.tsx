"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrderStatusFilter({ current }: { current: string }) {
  const router = useRouter();
  return (
    <Select
      value={current}
      onValueChange={(v) =>
        router.push(`/admin/orders${v === "all" ? "" : `?status=${v}`}`)
      }
    >
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Всички статуси</SelectItem>
        <SelectItem value="NEW">Нови</SelectItem>
        <SelectItem value="FINDING">Търся</SelectItem>
        <SelectItem value="DONE">Изпълнени</SelectItem>
        <SelectItem value="REFUSED">Отказани</SelectItem>
      </SelectContent>
    </Select>
  );
}
