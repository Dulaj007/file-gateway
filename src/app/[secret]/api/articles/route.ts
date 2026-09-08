import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createSchema = z.object({
  siteKey: z.enum(["article1", "article2"]),
  slug: z.string().min(1).regex(SLUG_RE, "Lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(1),
  body: z.string().min(1),
  active: z.boolean().optional(),
});

export async function GET(request: Request, context: RouteContext<"/[secret]/api/articles">) {
  const { secret } = await context.params;
  const guard = await requireAdminApi(secret);
  if (!guard.ok) return guard.response;

  const articles = await db.articlePage.findMany({
    orderBy: [{ siteKey: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request, context: RouteContext<"/[secret]/api/articles">) {
  const { secret } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid article.", issues: parsed.error.issues }, { status: 400 });
  }

  const article = await db.articlePage
    .create({ data: parsed.data })
    .catch(() => null);
  if (!article) {
    return NextResponse.json(
      { error: "That slug is already used on this site." },
      { status: 409 }
    );
  }

  return NextResponse.json({ article }, { status: 201 });
}
