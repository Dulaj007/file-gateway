import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamFileResponse } from "@/lib/file-stream";
import { getSettings } from "@/lib/settings";

// Admin quick-download: bypasses the gateway entirely (SDD §6). Works
// regardless of downloadEnabled/expiresAt/status — those gate *public*
// access, not the admin's own ability to retrieve a file — and doesn't
// touch downloadCount, since that metric tracks real visitor downloads.
export async function GET(
  request: Request,
  context: RouteContext<"/[secret]/api/files/[id]/download">
) {
  const { secret, id } = await context.params;
  const guard = await requireAdminApi(secret);
  if (!guard.ok) return guard.response;

  const file = await db.fileItem.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const settings = await getSettings();
  return streamFileResponse(request, file, settings.bandwidthLimitKBps);
}
