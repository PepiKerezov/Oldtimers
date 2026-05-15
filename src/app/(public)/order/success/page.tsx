import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Заявката е изпратена" };

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-3">
        Готово
      </p>
      <h1 className="text-4xl md:text-5xl mb-6">Получихме заявката ти</h1>
      <p className="text-foreground/80 mb-8 text-lg">
        Ще ти отговорим лично в рамките на 1–2 работни дни на имейл.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link href="/">Към началото</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/articles">Прочети статии</Link>
        </Button>
      </div>
    </div>
  );
}
