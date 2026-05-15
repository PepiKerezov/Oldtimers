import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/UsersTable";
import { CreateAdminDialog } from "@/components/admin/CreateAdminDialog";

export const metadata = { title: "Управление на администратори" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const filter = (params.filter ?? "all") as "all" | "admins" | "users";
  const q = params.q?.trim() ?? "";

  const where = {
    ...(filter === "admins" ? { role: "ADMIN" } : {}),
    ...(filter === "users" ? { role: "USER" } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, accounts] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.account.findMany({
      select: { userId: true, providerId: true },
    }),
  ]);

  const providerByUser = new Map<string, string[]>();
  for (const a of accounts) {
    const list = providerByUser.get(a.userId) ?? [];
    list.push(a.providerId);
    providerByUser.set(a.userId, list);
  }

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    providers: providerByUser.get(u.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1">Управление на администратори</h1>
          <p className="text-foreground/70">
            {users.length} потребителя — повишавай и понижавай ролите им.
          </p>
        </div>
        <CreateAdminDialog />
      </div>
      <UsersTable
        users={rows}
        currentUserId={session?.user?.id ?? ""}
        filter={filter}
        q={q}
      />
    </div>
  );
}
