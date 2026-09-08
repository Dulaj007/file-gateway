import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getStorageUsedBytes } from "@/lib/storage";

export type Stats = {
  storageUsedBytes: number;
  storageCapBytes: number;
  storageFreeBytes: number;
  totalFiles: number;
  activeFiles: number;
  disabledFiles: number;
  expiredFiles: number;
};

// Recomputed from the DB (and, for storage, the FileItem rows that still
// exist on disk) on every call — see SDD Phase 8's "storage-used figure
// matches actual disk usage" acceptance criterion. No caching: this is an
// admin-only, low-traffic read, so there's no reason to risk staleness for it.
export async function getStats(): Promise<Stats> {
  const now = new Date();
  const settings = await getSettings();

  const [usedBytes, totalFiles, activeFiles, disabledFiles, expiredFiles] = await Promise.all([
    getStorageUsedBytes(),
    db.fileItem.count(),
    db.fileItem.count({
      where: { downloadEnabled: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    }),
    db.fileItem.count({ where: { downloadEnabled: false } }),
    db.fileItem.count({ where: { expiresAt: { lte: now } } }),
  ]);

  const storageCapBytes = settings.storageCapBytes;
  const storageFreeBytes = storageCapBytes > usedBytes ? storageCapBytes - usedBytes : 0n;

  return {
    storageUsedBytes: Number(usedBytes),
    storageCapBytes: Number(storageCapBytes),
    storageFreeBytes: Number(storageFreeBytes),
    totalFiles,
    activeFiles,
    disabledFiles,
    expiredFiles,
  };
}
