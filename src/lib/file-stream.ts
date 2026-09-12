import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { NextResponse } from "next/server";
import { parseRange } from "@/lib/range";
import { getStoredFilePath } from "@/lib/storage";
import { createThrottle } from "@/lib/throttle";
import type { FileItem } from "@/generated/prisma/client";

function contentDisposition(originalName: string): string {
  // RFC 5987/6266: an ASCII-safe fallback plus the proper UTF-8 encoded
  // filename*, since originalName is an uploader-controlled string that may
  // contain characters unsafe or invalid in a raw header value.
  const fallback = originalName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(originalName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

// Paces bytes through at bandwidthLimitKBps by delaying each chunk's flush
// — inserted between the disk read stream and the response so the cap
// applies to what actually reaches the client, not just the read speed.
function throttled(nodeStream: Readable, bandwidthLimitKBps: number): Readable {
  if (bandwidthLimitKBps <= 0) return nodeStream;
  const wait = createThrottle(bandwidthLimitKBps * 1024);
  const pace = new Transform({
    async transform(chunk, _encoding, callback) {
      await wait(chunk.length);
      callback(null, chunk);
    },
  });
  return nodeStream.pipe(pace);
}

// Streams `file` from disk with Range support. Shared by the public gateway
// download (GET /api/file/[id], gated behind a one-time token) and the
// admin quick-download (gated behind an admin session instead) — everything
// here runs only after the caller has already decided the request is
// authorized; this function doesn't know or care which check that was.
export async function streamFileResponse(
  request: Request,
  file: FileItem,
  bandwidthLimitKBps = 0
): Promise<NextResponse> {
  const filePath = getStoredFilePath(file.storedName);
  const stats = await stat(filePath).catch(() => null);
  if (!stats) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const fileSize = stats.size;
  const rangeHeader = request.headers.get("range");
  const range = rangeHeader ? parseRange(rangeHeader, fileSize) : null;

  const headers = new Headers({
    "Content-Type": file.mimeType,
    "Content-Disposition": contentDisposition(file.originalName),
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
    return new NextResponse(Readable.toWeb(throttled(nodeStream, bandwidthLimitKBps)) as ReadableStream, {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(fileSize));
  const nodeStream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(throttled(nodeStream, bandwidthLimitKBps)) as ReadableStream, {
    status: 200,
    headers,
  });
}
