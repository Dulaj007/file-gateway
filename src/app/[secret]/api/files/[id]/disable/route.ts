import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeFile } from "@/lib/files";

export async function POST(
  request: Request,
  context: RouteContext<"/[secret]/api/files/[id]/disable">
) {
  const { secret, id } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const file = await db.fileItem
    .update({ where: { id }, data: { downloadEnabled: false } })
    .catch(() => null);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.json({ file: serializeFile(file) });
}
