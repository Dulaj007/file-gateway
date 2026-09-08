import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/db";
import { getCurrentSiteRole } from "@/lib/site";
import { GateWidget } from "@/components/gate-widget";

export default async function ArticlePage({ params }: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const role = await getCurrentSiteRole();

  if (role !== "article1" && role !== "article2") {
    notFound();
  }

  const article = await db.articlePage.findUnique({
    where: { siteKey_slug: { siteKey: role, slug } },
  });

  if (!article) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-fg">{article.title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-fg [&_p]:mb-4 [&_strong]:text-fg">
        <ReactMarkdown>{article.body}</ReactMarkdown>
      </div>
      <GateWidget />
    </article>
  );
}
