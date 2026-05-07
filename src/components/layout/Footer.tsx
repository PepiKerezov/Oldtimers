import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 mt-12">
      <div className="mx-auto max-w-6xl px-6 py-12 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="Old Timer's" className="h-8 w-auto" />
          </div>
          <p className="text-foreground/70 max-w-xs">
            Части за класически автомобили. Намираме оригиналното, проверяваме
            автентичното, доставяме внимателно.
          </p>
          <p className="mt-4 italic text-foreground/60 text-xs">
            &bdquo;The best tunes are played on the oldest fiddles.&ldquo;
            <br />— Ralph Waldo Emerson
          </p>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-4">
            Навигация
          </h4>
          <ul className="space-y-2 text-foreground/80">
            <li><Link href="/" className="hover:text-primary">Начало</Link></li>
            <li><Link href="/articles" className="hover:text-primary">Статии</Link></li>
            <li><Link href="/order" className="hover:text-primary">Поръчай</Link></li>
            <li><Link href="/about" className="hover:text-primary">За нас</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Контакти</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-[0.2em] text-foreground/60 mb-4">
            Информация
          </h4>
          <ul className="space-y-2 text-foreground/80">
            <li><Link href="/privacy" className="hover:text-primary">Политика за поверителност</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Общи условия</Link></li>
            <li><Link href="/contact" className="hover:text-primary">За контакт с нас</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} Old Timer&apos;s. Всички права запазени.
      </div>
    </footer>
  );
}
