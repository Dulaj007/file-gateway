import { describe, expect, it } from "vitest";
import { parseRange } from "./range";

describe("parseRange", () => {
  const fileSize = 1000;

  it("parses a fully-specified range", () => {
    expect(parseRange("bytes=0-499", fileSize)).toEqual({ start: 0, end: 499 });
  });

  it("parses an open-ended range (to end of file)", () => {
    expect(parseRange("bytes=500-", fileSize)).toEqual({ start: 500, end: 999 });
  });

  it("parses a suffix range (last N bytes)", () => {
    expect(parseRange("bytes=-100", fileSize)).toEqual({ start: 900, end: 999 });
  });

  it("clamps an end beyond the file size", () => {
    expect(parseRange("bytes=900-2000", fileSize)).toEqual({ start: 900, end: 999 });
  });

  it("clamps an oversized suffix to the whole file", () => {
    expect(parseRange("bytes=-5000", fileSize)).toEqual({ start: 0, end: 999 });
  });

  it("rejects a start at or beyond the file size", () => {
    expect(parseRange("bytes=1000-", fileSize)).toBeNull();
  });

  it("rejects end before start", () => {
    expect(parseRange("bytes=500-100", fileSize)).toBeNull();
  });

  it("rejects malformed headers", () => {
    expect(parseRange("not a range", fileSize)).toBeNull();
    expect(parseRange("bytes=-", fileSize)).toBeNull();
    expect(parseRange("bytes=abc-def", fileSize)).toBeNull();
  });

  it("rejects multi-range requests", () => {
    expect(parseRange("bytes=0-100,200-300", fileSize)).toBeNull();
  });
});
