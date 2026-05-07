"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import { contactInputSchema } from "@/lib/schemas/contact";
import { submitContact } from "@/server/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<z.infer<typeof contactInputSchema>>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: { name: "", email: "", message: "", turnstileToken: "" },
  });

  async function onSubmit(values: z.infer<typeof contactInputSchema>) {
    setPending(true);
    const r = await submitContact(values);
    setPending(false);
    if (!r.success) {
      toast.error(r.error);
      return;
    }
    toast.success("Съобщението е изпратено");
    form.reset();
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <h3 className="text-2xl mb-2">Благодарим!</h3>
        <p className="text-foreground/75">
          Получихме съобщението ти и ще ти отговорим възможно най-скоро.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Съобщение</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="turnstileToken"
          render={({ field }) => (
            <FormItem>
              {TURNSTILE_SITE_KEY ? (
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  options={{ language: "bg", theme: "light" }}
                  onSuccess={(token) => field.onChange(token)}
                  onExpire={() => field.onChange("")}
                  onError={() => field.onChange("")}
                />
              ) : (
                <p className="text-xs text-foreground/60">
                  Turnstile not configured — bypass active in dev.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Изпращане…" : "Изпрати"}
        </Button>
      </form>
    </Form>
  );
}
