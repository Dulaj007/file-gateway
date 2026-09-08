import { db } from "@/lib/db";

export type ArticleSiteKey = "article1" | "article2";

// Step 2 is always the first article hop (article1); step 3 only exists as
// an article hop when articleHops === 2 (otherwise step 3 is the final
// step, handled separately in flow.ts).
export function articleSiteForStep(step: number): ArticleSiteKey {
  return step === 2 ? "article1" : "article2";
}

export async function pickRandomActiveArticleSlug(siteKey: ArticleSiteKey): Promise<string | null> {
  const articles = await db.articlePage.findMany({
    where: { siteKey, active: true },
    select: { slug: true },
  });
  if (articles.length === 0) return null;
  return articles[Math.floor(Math.random() * articles.length)].slug;
}
