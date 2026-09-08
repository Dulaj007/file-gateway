import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getStoredFilePath, resolveUploadDir } from "@/lib/storage";

// A disk file just written by an in-flight upload has no FileItem row yet —
// saveUploadStream() writes the bytes to their final storedName *before*
// POST /api/upload creates the DB row (see storage.ts). Without this guard,
// a cleanup tick landing in that window would delete a file mid-upload.
// 15 minutes is generous for any realistic upload to finish, and matches
// the cron cadence, so it never meaningfully delays reclaiming real orphans.
const ORPHAN_MIN_AGE_MS = 15 * 60 * 1000;

export type CleanupResult = {
  expiredFilesDeleted: number;
  expiredSessionsDeleted: number;
  orphanFilesDeleted: number;
};

// Pure — kept separate from the directory scan so it's trivial to unit test.
export function findOrphanFileNames(
  diskEntries: { name: string; mtimeMs: number }[],
  knownStoredNames: ReadonlySet<string>,
  now: number,
  minAgeMs: number = ORPHAN_MIN_AGE_MS
): string[] {
  return diskEntries
    .filter(
      (entry) =>
        // Dotfiles (e.g. uploads/.gitkeep) are never something this app
        // writes — randomStoredName() never produces a dot-prefixed name —
        // so they're always placeholders or tooling metadata, not orphans.
        !entry.name.startsWith(".") &&
        !knownStoredNames.has(entry.name) &&
        now - entry.mtimeMs >= minAgeMs
    )
    .map((entry) => entry.name);
}

// Deletes expired files (disk + DB), purges expired DownloadSession rows,
// and reclaims orphaned disk files with no matching FileItem row. Safe to
// call repeatedly/concurrently: each deletion is independent and a
// not-found on the DB side (e.g. an admin deleted the same file
// concurrently) is treated as already-done, not an error.
export async function runCleanup(now: Date = new Date()): Promise<CleanupResult> {
  const expiredFiles = await db.fileItem.findMany({
    where: { expiresAt: { not: null, lte: now } },
    select: { id: true, storedName: true },
  });
  for (const file of expiredFiles) {
    await rm(getStoredFilePath(file.storedName), { force: true });
    await db.fileItem.delete({ where: { id: file.id } }).catch(() => {});
  }

  const { count: expiredSessionsDeleted } = await db.downloadSession.deleteMany({
    where: { expiresAt: { lte: now } },
  });

  const uploadDir = resolveUploadDir();
  let diskEntries: { name: string; mtimeMs: number }[] = [];
  try {
    const dirents = await readdir(uploadDir, { withFileTypes: true });
    diskEntries = await Promise.all(
      dirents
        .filter((d) => d.isFile())
        .map(async (d) => {
          const s = await stat(path.join(uploadDir, d.name));
          return { name: d.name, mtimeMs: s.mtimeMs };
        })
    );
  } catch {
    diskEntries = []; // upload dir doesn't exist yet — nothing to reconcile
  }

  let orphanFilesDeleted = 0;
  if (diskEntries.length > 0) {
    const known = await db.fileItem.findMany({ select: { storedName: true } });
    const knownSet = new Set(known.map((f) => f.storedName));
    const orphans = findOrphanFileNames(diskEntries, knownSet, now.getTime());
    for (const name of orphans) {
      await rm(path.join(uploadDir, name), { force: true }).catch(() => {});
      orphanFilesDeleted++;
    }
  }

  return {
    expiredFilesDeleted: expiredFiles.length,
    expiredSessionsDeleted,
    orphanFilesDeleted,
  };
}
