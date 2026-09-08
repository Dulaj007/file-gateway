import type { FileItem } from "@/generated/prisma/client";

// FileItem.sizeBytes is a Prisma BigInt, which JSON.stringify can't
// serialize on its own (NextResponse.json() would throw). Number() is safe
// here: real upload sizes are always far below Number.MAX_SAFE_INTEGER,
// bounded by the admin-configured per-type limits.
export function serializeFile(file: FileItem) {
  return {
    id: file.id,
    publicSlug: file.publicSlug,
    finalSlug: file.finalSlug,
    originalName: file.originalName,
    mimeType: file.mimeType,
    category: file.category,
    sizeBytes: Number(file.sizeBytes),
    status: file.status,
    downloadEnabled: file.downloadEnabled,
    downloadCount: file.downloadCount,
    createdAt: file.createdAt,
    expiresAt: file.expiresAt,
  };
}

export type SerializedFile = ReturnType<typeof serializeFile>;
