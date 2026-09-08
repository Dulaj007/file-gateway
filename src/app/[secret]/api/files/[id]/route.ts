import { rm } from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeFile } from "@/lib/files";
import { getStoredFilePath } from "@/lib/storage";
import type { Prisma } from "@/generated/prisma/client";

const bodySchema = z.object({
  downloadEnabled: z.boolean().optional(),
  // ISO date string, or null for "never" — the admin UI resolves a preset
  // (1d/7d/30d/custom) to an actual date client-side before sending it,
  // reusing the same lib/expiry.ts math the upload route uses server-side.
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(request: Request, context: RouteContext<"/[secret]/api/files/[id]">) {
  const { secret, id } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const data: Prisma.FileItemUpdateInput = {};
  if (parsed.data.downloadEnabled !== undefined) {
    data.downloadEnabled = parsed.data.downloadEnabled;
  }
  if (parsed.data.expiresAt !== undefined) {
    data.expiresAt = parsed.data.expiresAt === null ? null : new Date(parsed.data.expiresAt);
  }

  const file = await db.fileItem.update({ where: { id }, data }).catch(() => null);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.json({ file: serializeFile(file) });
}

export async function DELETE(request: Request, context: RouteContext<"/[secret]/api/files/[id]">) {
  const { secret, id } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const file = await db.fileItem.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  await rm(getStoredFilePath(file.storedName), { force: true });
  await db.fileItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
