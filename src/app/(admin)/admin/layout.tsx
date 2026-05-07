import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/admin");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen flex">
      <AdminSidebar
        user={{
          name: session.user.name ?? session.user.email,
          email: session.user.email,
        }}
      />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-background/80 backdrop-blur">
          <Link href="/" className="text-sm text-foreground/70 hover:text-primary">
            ← Към сайта
          </Link>
        </header>
        <main className="flex-1 p-6 md:p-10 max-w-6xl w-full">{children}</main>
      </div>
    </div>
  );
}
