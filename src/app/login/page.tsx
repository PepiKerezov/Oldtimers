import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/LoginForm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Вход" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/admin";
  if (session?.user) redirect(redirectTo);

  return (
    <>
      <Header />
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl mb-2">Вход</h1>
          <p className="text-sm text-foreground/70 mb-8">
            Достъп само за администратори.
          </p>
          <LoginForm redirectTo={redirectTo} />
        </div>
      </main>
      <Footer />
    </>
  );
}
