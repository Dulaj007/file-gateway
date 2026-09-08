import { rm } from "node:fs/promises";
import { Readable } from "node:stream";
import Busboy from "busboy";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeExpiresAt } from "@/lib/expiry";
import { evaluateIpQuota, getClientIp, getIpUsageToday } from "@/lib/ipusage";
import { getSettings } from "@/lib/settings";
import { randomSlug } from "@/lib/slug";
import { getStorageUsedBytes, saveUploadStream, UploadRejected, wouldExceedStorageCap } from "@/lib/storage";
import { buildDisplayLink } from "@/lib/url";

type SaveResult = Awaited<ReturnType<typeof saveUploadStream>>;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!request.body) {
    return jsonError("No file provided.", 400);
  }

  const settings = await getSettings();
  const ip = getClientIp(request);
  const quotaLimits = {
    ipDailyMaxUploads: settings.ipDailyMaxUploads,
    ipDailyMaxBytes: settings.ipDailyMaxBytes,
  };

  // Cheap pre-checks that don't require reading the request body at all.
  const usageBeforeUpload = await getIpUsageToday(ip);
  const preIpCheck = evaluateIpQuota(usageBeforeUpload, 0n, quotaLimits);
  if (!preIpCheck.ok) {
    return jsonError(preIpCheck.reason, 429);
  }

  const usedBytesBeforeUpload = await getStorageUsedBytes();
  if (wouldExceedStorageCap(usedBytesBeforeUpload, 0n, settings.storageCapBytes)) {
    return jsonError("Storage is full. Try again later.", 507);
  }

  const contentType = request.headers.get("content-type");
  if (!contentType) {
    return jsonError("Missing content-type header.", 400);
  }

  let saved: SaveResult;
  let originalName = "upload";

  try {
    saved = await new Promise<SaveResult>((resolve, reject) => {
      const bb = Busboy({ headers: { "content-type": contentType }, limits: { files: 1 } });
      let sawFile = false;

      bb.on("file", (_name, fileStream, info) => {
        sawFile = true;
        originalName = info.filename || originalName;

        saveUploadStream(fileStream, {
          image: Number(settings.imageMaxBytes),
          video: Number(settings.videoMaxBytes),
          zip: Number(settings.zipMaxBytes),
        })
          .then(resolve)
          .catch(reject);
      });

      bb.on("error", reject);

      bb.on("close", () => {
        if (!sawFile) reject(new UploadRejected(400, "No file provided."));
      });

      Readable.fromWeb(request.body as import("node:stream/web").ReadableStream<Uint8Array>).pipe(
        bb
      );
    });
  } catch (err) {
    if (err instanceof UploadRejected) {
      return jsonError(err.message, err.status);
    }
    console.error("Upload failed:", err);
    return jsonError("Upload failed.", 500);
  }

  // Authoritative checks now that the exact size is known — cheaper to check
  // upfront (above), but only the real size can be checked accurately.
  const sizeBytes = BigInt(saved.sizeBytes);

  if (wouldExceedStorageCap(usedBytesBeforeUpload, sizeBytes, settings.storageCapBytes)) {
    await rm(saved.filePath, { force: true });
    return jsonError("Storage is full. Try again later.", 507);
  }

  const ipCheck = evaluateIpQuota(usageBeforeUpload, sizeBytes, quotaLimits);
  if (!ipCheck.ok) {
    await rm(saved.filePath, { force: true });
    return jsonError(ipCheck.reason, 429);
  }

  const publicSlug = randomSlug();
  const finalSlug = randomSlug();
  const expiresAt = computeExpiresAt(settings.defaultExpiry);

  await db.fileItem.create({
    data: {
      publicSlug,
      finalSlug,
      originalName,
      storedName: saved.storedName,
      mimeType: saved.mime,
      category: saved.category,
      sizeBytes,
      sha256: saved.sha256,
      uploaderIp: ip,
      expiresAt,
    },
  });

  const displayLink = buildDisplayLink(request, settings, publicSlug);

  return NextResponse.json({ displayLink, expiresAt });
}
