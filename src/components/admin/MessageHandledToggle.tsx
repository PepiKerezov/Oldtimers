"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleContactHandled } from "@/server/contact";
import { Button } from "@/components/ui/button";

export function MessageHandledToggle({
  id,
  handled,
}: {
  id: string;
  handled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const r = await toggleContactHandled(id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(r.data.handled ? "Маркирано като обработено" : "Маркирано като ново");
      router.refresh();
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending} variant="outline" size="sm">
      {handled ? "Маркирай ново" : "Маркирай обработено"}
    </Button>
  );
}
