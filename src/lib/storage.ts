import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { Readable } from "node:stream";
import { db } from "@/lib/db";
import { detectCategory, type UploadCategory } from "@/lib/filetype";
import { randomStoredName } from "@/lib/slug";

// file-type's own guidance: a few KB is enough to reliably identify any
// supported format from its magic bytes.
const SNIFF_BYTES = 4100;

export function resolveUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? "./uploads";
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
}

export async function getStorageUsedBytes(): Promise<bigint> {
  const result = await db.fileItem.aggregate({
    where: { status: "active" },
    _sum: { sizeBytes: true },
  });
  return result._sum.sizeBytes ?? 0n;
}

// Pure comparison, kept separate from the DB sum above so it's trivial to
// unit test (SDD §14: "storage-cap ... math").
export function wouldExceedStorageCap(
  usedBytes: bigint,
  incomingBytes: bigint,
  capBytes: bigint
): boolean {
  return usedBytes + incomingBytes > capBytes;
}

export class UploadRejected extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export type SavedUpload = {
  storedName: string;
  filePath: string;
  sizeBytes: number;
  sha256: string;
  mime: string;
  ext: string;
  category: UploadCategory;
};

// Streams a single upload to disk with a hard per-category byte ceiling
// (SDD §11: "connection aborted if exceeded"). Magic bytes are sniffed from
// the start of the stream *before* the category (and therefore its size
// limit) is known, so the peeked chunks are buffered and written first once
// detection completes — using the stream's iterator directly (not a
// for-await-of break) since breaking a for-await-of loop early closes the
// stream via the iterator's return(), which would abort the upload.
export async function saveUploadStream(
  fileStream: Readable,
  maxBytesByCategory: Record<UploadCategory, number>
): Promise<SavedUpload> {
  const uploadDir = resolveUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const iterator = fileStream[Symbol.asyncIterator]() as AsyncIterator<Buffer>;

  const initialChunks: Buffer[] = [];
  let initialBytes = 0;
  let streamEnded = false;

  while (initialBytes < SNIFF_BYTES) {
    const { value, done } = await iterator.next();
    if (done) {
      streamEnded = true;
      break;
    }
    initialChunks.push(value);
    initialBytes += value.length;
  }

  const detected = await detectCategory(Buffer.concat(initialChunks));
  if (!detected) {
    fileStream.destroy();
    throw new UploadRejected(415, "Unsupported file type.");
  }

  const maxBytes = maxBytesByCategory[detected.category];
  const storedName = randomStoredName(detected.ext);
  const filePath = path.join(uploadDir, storedName);

  const hash = createHash("sha256");
  const writeStream = createWriteStream(filePath);
  let totalBytes = 0;

  async function writeChunk(chunk: Buffer) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw new UploadRejected(413, "File exceeds the maximum allowed size for its type.");
    }
    hash.update(chunk);
    if (!writeStream.write(chunk)) {
      await new Promise<void>((resolve) => writeStream.once("drain", () => resolve()));
    }
  }

  try {
    for (const chunk of initialChunks) {
      await writeChunk(chunk);
    }
    if (!streamEnded) {
      while (true) {
        const { value, done } = await iterator.next();
        if (done) break;
        await writeChunk(value);
      }
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    writeStream.destroy();
    fileStream.destroy();
    await rm(filePath, { force: true });
    throw err;
  }

  return {
    storedName,
    filePath,
    sizeBytes: totalBytes,
    sha256: hash.digest("hex"),
    mime: detected.mime,
    ext: detected.ext,
    category: detected.category,
  };
}
