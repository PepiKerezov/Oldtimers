"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Преглед" },
  { href: "/admin/articles", label: "Статии" },
  { href: "/admin/orders", label: "Поръчки" },
  { href: "/admin/messages", label: "Съобщения" },
  { href: "/admin/users", label: "Управление на администратори" },
];

export function AdminSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-secondary/30 hidden md:flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="Old Timer's" className="h-7 w-auto" />
          <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
            Admin
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
        {NAV.map((n) => {
          const active =
            pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "block rounded-md px-3 py-2 transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-card hover:text-primary",
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-4 text-sm">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-xs text-foreground/60 truncate">{user.email}</p>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="mt-3 w-full"
        >
          Изход
        </Button>
      </div>
    </aside>
  );
}
