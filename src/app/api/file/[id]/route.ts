import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { redeemDownloadToken } from "@/lib/flow";
import { parseRange } from "@/lib/range";
import { getStoredFilePath } from "@/lib/storage";

function contentDisposition(originalName: string): string {
  // RFC 5987/6266: an ASCII-safe fallback plus the proper UTF-8 encoded
  // filename*, since originalName is an uploader-controlled string that may
  // contain characters unsafe or invalid in a raw header value.
  const fallback = originalName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(originalName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

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

  const filePath = getStoredFilePath(result.file.storedName);
  const stats = await stat(filePath).catch(() => null);
  if (!stats) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const fileSize = stats.size;
  const rangeHeader = request.headers.get("range");
  const range = rangeHeader ? parseRange(rangeHeader, fileSize) : null;

  const headers = new Headers({
    "Content-Type": result.file.mimeType,
    "Content-Disposition": contentDisposition(result.file.originalName),
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });

  if (rangeHeader && !range) {
    headers.set("Content-Range", `bytes */${fileSize}`);
    return new NextResponse(null, { status: 416, headers });
  }

  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${fileSize}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    const nodeStream = createReadStream(filePath, { start: range.start, end: range.end });
    return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(fileSize));
  const nodeStream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
    status: 200,
    headers,
  });
}
