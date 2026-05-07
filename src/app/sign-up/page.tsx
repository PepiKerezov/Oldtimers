import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignUpForm } from "@/components/forms/SignUpForm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Регистрация" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/";
  if (session?.user) redirect(redirectTo);

  return (
    <>
      <Header />
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl mb-2">Регистрация</h1>
          <p className="text-sm text-foreground/70 mb-8">
            Създай акаунт за да се свързваш с нас и да следиш поръчките си.
          </p>
          <SignUpForm redirectTo={redirectTo} />
          <p className="mt-6 text-sm text-foreground/70 text-center">
            Вече имаш профил?{" "}
            <Link
              href={`/login${params.redirect ? `?redirect=${encodeURIComponent(params.redirect)}` : ""}`}
              className="text-primary underline"
            >
              Вход
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
