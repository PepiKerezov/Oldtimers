import { ArticleForm } from "@/components/forms/ArticleForm";

export const metadata = { title: "Нова статия" };

export default function NewArticlePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl">Нова статия</h1>
      <ArticleForm mode="create" />
    </div>
  );
}
