import { NextResponse } from "next/server";
import { redeemDownloadToken } from "@/lib/flow";
import { streamFileResponse } from "@/lib/file-stream";

export async function GET(request: Request, context: RouteContext<"/api/file/[id]">) {
  const { id } = await context.params;
  const dlToken = new URL(request.url).searchParams.get("dl");
  if (!dlToken) {
    return NextResponse.json({ error: "Missing download token." }, { status: 400 });
  }

  const result = await redeemDownloadToken(id, dlToken);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }

  return streamFileResponse(request, result.file);
}
