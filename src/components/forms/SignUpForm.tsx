"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  name: z.string().min(2, "Поне 2 знака").max(80),
  email: z.string().email("Невалиден имейл"),
  password: z.string().min(8, "Минимум 8 знака"),
});

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setPending("email");
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    setPending(null);
    if (error) {
      toast.error(error.message ?? "Грешка при регистрация");
      return;
    }
    toast.success("Профилът е създаден");
    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    setPending("google");
    await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Име</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имейл</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Парола</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={pending !== null}>
            {pending === "email" ? "Създаване…" : "Регистрация"}
          </Button>
        </form>
      </Form>
      <div className="relative my-6 flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-3 text-xs uppercase tracking-wider text-foreground/60">
          или
        </span>
        <div className="flex-grow border-t border-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={pending !== null}
      >
        {pending === "google" ? "Препращане…" : "Регистрация с Google"}
      </Button>
    </div>
  );
}
