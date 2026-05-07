"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import { orderInputSchema } from "@/lib/schemas/order";
import { submitOrder } from "@/server/orders";
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

export function OrderForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof orderInputSchema>>({
    resolver: zodResolver(orderInputSchema),
    defaultValues: {
      carMake: "",
      carModel: "",
      carYear: new Date().getFullYear() - 30,
      partDesc: "",
      customerName: "",
      email: "",
      phone: "",
      notes: "",
      turnstileToken: "",
    },
  });

  async function onSubmit(values: z.infer<typeof orderInputSchema>) {
    setPending(true);
    const r = await submitOrder(values);
    setPending(false);
    if (!r.success) {
      toast.error(r.error);
      return;
    }
    toast.success("Заявката е изпратена");
    form.reset();
    router.push("/order/success");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carMake"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Марка</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mercedes-Benz" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="carModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Модел</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="W123 200D" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="carYear"
          render={({ field }) => (
            <FormItem className="max-w-[180px]">
              <FormLabel>Година</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || "")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partDesc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Какво търсиш</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder='Опиши частта с подробности — например: предна решетка с вградено лого, оригинална, не репродукция.'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Твоето име</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" />
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
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Телефон</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+359888123456"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Допълнителни бележки (по желание)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
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

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Изпращане…" : "Изпрати заявка"}
        </Button>
      </form>
    </Form>
  );
}
