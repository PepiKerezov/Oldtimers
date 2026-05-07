"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArticleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-4xl mb-4">Възникна грешка</h1>
      <p className="text-foreground/70 mb-8">
        Опитай отново или се върни към всички статии.
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset} variant="outline">
          Опитай отново
        </Button>
        <Button asChild>
          <Link href="/articles">Към статиите</Link>
        </Button>
      </div>
    </div>
  );
}
