export type ByteRange = { start: number; end: number };

// Parses a single-range `Range: bytes=...` header (RFC 7233). Multi-range
// requests (comma-separated) aren't supported — real clients requesting
// resumable/seekable video or zip downloads always send a single range, and
// multi-range responses require multipart/byteranges, which is unnecessary
// complexity for this use case. Returns null for anything absent, malformed,
// multi-range, or out of bounds — the caller treats that as "416".
export function parseRange(rangeHeader: string, fileSize: number): ByteRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const [, startStr, endStr] = match;
  if (startStr === "" && endStr === "") return null;

  let start: number;
  let end: number;

  if (startStr === "") {
    // Suffix range: last N bytes.
    const suffixLength = Number(endStr);
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    start = Number(startStr);
    end = endStr === "" ? fileSize - 1 : Number(endStr);
  }

  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || end < start || start >= fileSize) return null;

  return { start, end: Math.min(end, fileSize - 1) };
}
