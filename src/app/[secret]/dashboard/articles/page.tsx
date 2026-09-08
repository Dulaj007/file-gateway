import { ArticlesManager } from "@/components/articles-manager";

export default async function ArticlesPage({ params }: PageProps<"/[secret]/dashboard/articles">) {
  const { secret } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Articles</h1>
      <ArticlesManager secret={secret} />
    </div>
  );
}
