import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { saveUploadStream, UploadRejected, wouldExceedStorageCap } from "./storage";

describe("wouldExceedStorageCap", () => {
  it("allows uploads that fit within the cap", () => {
    expect(wouldExceedStorageCap(100n, 50n, 200n)).toBe(false);
  });

  it("allows exactly filling the cap", () => {
    expect(wouldExceedStorageCap(100n, 100n, 200n)).toBe(false);
  });

  it("rejects uploads that would exceed the cap", () => {
    expect(wouldExceedStorageCap(150n, 60n, 200n)).toBe(true);
  });
});

// A minimal real ZIP local-file-header signature, padded so file-type has
// enough bytes to commit to a match (see filetype.test.ts).
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);

function readableFrom(chunks: Buffer[]): Readable {
  return Readable.from(chunks);
}

describe("saveUploadStream", () => {
  let uploadDir: string;
  let originalUploadDir: string | undefined;

  beforeEach(async () => {
    uploadDir = await mkdtemp(path.join(tmpdir(), "filegateway-upload-test-"));
    originalUploadDir = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = uploadDir;
  });

  afterEach(async () => {
    process.env.UPLOAD_DIR = originalUploadDir;
    await rm(uploadDir, { recursive: true, force: true });
  });

  it("detects the category, writes the file, and hashes it", async () => {
    const body = Buffer.from("this is the rest of the zip contents");
    const stream = readableFrom([ZIP_SIGNATURE, body]);

    const result = await saveUploadStream(stream, { image: 1_000, video: 1_000, zip: 1_000 });

    expect(result.category).toBe("zip");
    expect(result.ext).toBe("zip");
    expect(result.sizeBytes).toBe(ZIP_SIGNATURE.length + body.length);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);

    const files = await readdir(uploadDir);
    expect(files).toEqual([result.storedName]);
  });

  it("rejects an unrecognized file type without writing anything", async () => {
    const stream = readableFrom([Buffer.from("just plain text, not a real file")]);

    await expect(
      saveUploadStream(stream, { image: 1_000, video: 1_000, zip: 1_000 })
    ).rejects.toThrow(UploadRejected);

    expect(await readdir(uploadDir)).toEqual([]);
  });

  it("aborts and cleans up when the file exceeds the category's byte ceiling", async () => {
    const oversizedBody = Buffer.alloc(500, 1);
    const stream = readableFrom([ZIP_SIGNATURE, oversizedBody]);

    await expect(
      saveUploadStream(stream, { image: 1_000, video: 1_000, zip: 100 })
    ).rejects.toThrow(/exceeds the maximum/);

    // The partial file must not be left behind on disk.
    expect(await readdir(uploadDir)).toEqual([]);
  });
});
