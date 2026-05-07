import { ArticleCard, type ArticleCardData } from "./ArticleCard";

export function ArticleGrid({ articles }: { articles: ArticleCardData[] }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
