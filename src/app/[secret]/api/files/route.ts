import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeFile } from "@/lib/files";
import { getSettings } from "@/lib/settings";
import { buildDisplayLink } from "@/lib/url";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

const querySchema = z.object({
  query: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().catch(1),
  category: z.enum(["image", "video", "zip"]).optional(),
  // A derived, display-oriented status rather than the raw (and, in this
  // app, always-"active") FileItem.status column — see CLAUDE.md's Phase 6
  // note on why downloadEnabled/expiresAt drive this instead.
  status: z.enum(["active", "disabled", "expired"]).optional(),
});

export async function GET(request: Request, context: RouteContext<"/[secret]/api/files">) {
  const { secret } = await context.params;
  const guard = await requireAdminApi(secret);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  }
  const { query, page, category, status } = parsed.data;

  const where: Prisma.FileItemWhereInput = { status: { not: "deleted" } };
  if (query) where.originalName = { contains: query };
  if (category) where.category = category;
  if (status === "disabled") {
    where.downloadEnabled = false;
  } else if (status === "expired") {
    where.expiresAt = { lte: new Date() };
  } else if (status === "active") {
    where.downloadEnabled = true;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  }

  const [files, total] = await Promise.all([
    db.fileItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.fileItem.count({ where }),
  ]);

  const settings = await getSettings();
  return NextResponse.json({
    files: files.map((file) => ({
      ...serializeFile(file),
      displayLink: buildDisplayLink(request, settings, file.publicSlug),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  });
}
