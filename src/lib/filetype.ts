import { fileTypeFromBuffer } from "file-type";

export type UploadCategory = "image" | "video" | "zip";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
]);

const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/mpeg",
  "video/3gpp",
  "video/3gpp2",
  "video/x-flv",
  "video/x-m4v",
]);

const ZIP_MIMES = new Set(["application/zip"]);

// Pure mapping, kept separate from the magic-byte sniffing below so it's
// trivial to unit test without constructing real binary file signatures.
export function categorizeMime(mime: string): UploadCategory | null {
  if (IMAGE_MIMES.has(mime)) return "image";
  if (VIDEO_MIMES.has(mime)) return "video";
  if (ZIP_MIMES.has(mime)) return "zip";
  return null;
}

export type DetectedFile = {
  category: UploadCategory;
  mime: string;
  ext: string;
};

// Detects the REAL type from magic bytes — never trust the client-supplied
// filename/extension/Content-Type. Returns null for anything unrecognized or
// outside the image/video/zip allow-list (SDD §11 checklist).
export async function detectCategory(buffer: Buffer | Uint8Array): Promise<DetectedFile | null> {
  const result = await fileTypeFromBuffer(buffer);
  if (!result) return null;

  const category = categorizeMime(result.mime);
  if (!category) return null;

  return { category, mime: result.mime, ext: result.ext };
}
