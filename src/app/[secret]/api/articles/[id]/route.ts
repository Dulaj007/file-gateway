import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const updateSchema = z.object({
  siteKey: z.enum(["article1", "article2"]).optional(),
  slug: z.string().min(1).regex(SLUG_RE, "Lowercase letters, numbers, and hyphens only.").optional(),
  title: z.string().trim().min(1).optional(),
  body: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/[secret]/api/articles/[id]">
) {
  const { secret, id } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid article.", issues: parsed.error.issues }, { status: 400 });
  }

  const article = await db.articlePage
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);
  if (!article) {
    return NextResponse.json(
      { error: "Article not found, or that slug is already used on this site." },
      { status: 404 }
    );
  }

  return NextResponse.json({ article });
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/[secret]/api/articles/[id]">
) {
  const { secret, id } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const deleted = await db.articlePage.delete({ where: { id } }).catch(() => null);
  if (!deleted) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
