import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArticleNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-4xl mb-4">Статията не е намерена</h1>
      <p className="text-foreground/70 mb-8">
        Може би е била премахната или адресът е грешен.
      </p>
      <Button asChild>
        <Link href="/articles">Към всички статии</Link>
      </Button>
    </div>
  );
}
