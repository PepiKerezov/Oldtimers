"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArticleCategory } from "@prisma/client";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { CATEGORY_OPTIONS, slugify } from "@/lib/articles";
import { articleInputSchema } from "@/lib/schemas/article";
import { createArticle, updateArticle } from "@/server/articles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  mode: "create" | "edit";
  initial?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: ArticleCategory;
    coverImage: string | null;
    content: unknown;
  };
};

const formSchema = articleInputSchema.extend({
  content: z.record(z.string(), z.unknown()),
});

export function ArticleForm({ mode, initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      excerpt: initial?.excerpt ?? "",
      category: initial?.category ?? "novini",
      coverImage: initial?.coverImage ?? "",
      content: (initial?.content as Record<string, unknown>) ?? {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    },
  });

  async function uploadCover(file: File) {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Грешка при качване");
        return;
      }
      form.setValue("coverImage", data.url, { shouldDirty: true });
      toast.success("Кавър изображението е качено");
    } finally {
      setCoverUploading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setPending(true);
    const payload = { ...values, coverImage: values.coverImage || "" };
    const result =
      mode === "create"
        ? await createArticle(payload)
        : await updateArticle(initial!.id, payload);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(mode === "create" ? "Статията е създадена" : "Статията е обновена");
    router.push(`/admin/articles/${result.data.id}/edit`);
    router.refresh();
  }

  const cover = form.watch("coverImage");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заглавие</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onBlur={() => {
                    if (!form.getValues("slug") && field.value) {
                      form.setValue("slug", slugify(field.value));
                    }
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="kak-da-razpoznaesh-originalna-chast" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Кавър изображение</FormLabel>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={coverUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCover(f);
                  e.target.value = "";
                }}
                className="text-sm"
              />
              {cover && (
                <button
                  type="button"
                  onClick={() => form.setValue("coverImage", "", { shouldDirty: true })}
                  className="text-xs text-foreground/60 underline"
                >
                  Премахни
                </button>
              )}
            </div>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt="кавър"
                className="mt-2 max-h-40 rounded-md border border-border"
              />
            )}
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Кратко описание</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Съдържание</FormLabel>
              <FormControl>
                <TiptapEditor
                  initialContent={field.value as object}
                  onChange={(json) =>
                    field.onChange(json as Record<string, unknown>)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Запазване…" : mode === "create" ? "Създай" : "Запази"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/articles")}
          >
            Отказ
          </Button>
        </div>
      </form>
    </Form>
  );
}
