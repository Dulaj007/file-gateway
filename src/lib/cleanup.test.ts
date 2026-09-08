import { describe, expect, it } from "vitest";
import { findOrphanFileNames } from "./cleanup";

const NOW = 1_000_000_000; // arbitrary fixed epoch ms
const MIN_AGE = 15 * 60 * 1000;

describe("findOrphanFileNames", () => {
  it("flags a disk file with no matching DB row, once old enough", () => {
    const entries = [{ name: "orphan.png", mtimeMs: NOW - MIN_AGE - 1 }];
    expect(findOrphanFileNames(entries, new Set(), NOW, MIN_AGE)).toEqual(["orphan.png"]);
  });

  it("does not flag a disk file that has a matching DB row", () => {
    const entries = [{ name: "known.png", mtimeMs: NOW - MIN_AGE - 1 }];
    expect(findOrphanFileNames(entries, new Set(["known.png"]), NOW, MIN_AGE)).toEqual([]);
  });

  it("does not flag a recently-written file even with no DB row yet (in-flight upload)", () => {
    const entries = [{ name: "mid-upload.zip", mtimeMs: NOW - 1000 }];
    expect(findOrphanFileNames(entries, new Set(), NOW, MIN_AGE)).toEqual([]);
  });

  it("flags a file exactly at the age boundary", () => {
    const entries = [{ name: "boundary.zip", mtimeMs: NOW - MIN_AGE }];
    expect(findOrphanFileNames(entries, new Set(), NOW, MIN_AGE)).toEqual(["boundary.zip"]);
  });

  it("never flags a dotfile, however old, since this app never writes one (e.g. uploads/.gitkeep)", () => {
    const entries = [{ name: ".gitkeep", mtimeMs: NOW - MIN_AGE - 1_000_000 }];
    expect(findOrphanFileNames(entries, new Set(), NOW, MIN_AGE)).toEqual([]);
  });

  it("only flags the actual orphans out of a mixed set", () => {
    const entries = [
      { name: "old-orphan.png", mtimeMs: NOW - MIN_AGE - 5000 },
      { name: "old-known.png", mtimeMs: NOW - MIN_AGE - 5000 },
      { name: "new-orphan.png", mtimeMs: NOW - 100 },
    ];
    const known = new Set(["old-known.png"]);
    expect(findOrphanFileNames(entries, known, NOW, MIN_AGE)).toEqual(["old-orphan.png"]);
  });
});
