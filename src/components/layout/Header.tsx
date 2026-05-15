import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UserMenu } from "@/components/layout/UserMenu";

const NAV = [
  { href: "/", label: "Начало" },
  { href: "/articles", label: "Статии" },
  { href: "/order", label: "Поръчай" },
  { href: "/about", label: "За нас" },
  { href: "/contact", label: "Контакти" },
];

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="border-b border-border bg-background/85 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="Old Timer's" className="h-8 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <UserMenu
              user={{
                name: session.user.name ?? session.user.email,
                email: session.user.email,
                role: (session.user as { role?: string }).role ?? "USER",
              }}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
