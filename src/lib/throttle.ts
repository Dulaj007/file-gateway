// Paces a stream of chunks to a target throughput using a simple
// "expected time vs. actual time" schedule rather than a fixed per-chunk
// delay — this self-corrects for chunk-size variance (a mix of large and
// small chunks still averages out to the target rate) instead of drifting.
export function createThrottle(bytesPerSecond: number) {
  const startTime = Date.now();
  let bytesSent = 0;

  // `wait` is called after each chunk is handed off (written to disk, or
  // pushed downstream) with that chunk's size — bytesPerSecond <= 0 means
  // unlimited, so it's a no-op rather than a divide-by-zero.
  return async function wait(chunkLength: number): Promise<void> {
    bytesSent += chunkLength;
    if (bytesPerSecond <= 0) return;

    const expectedMs = (bytesSent / bytesPerSecond) * 1000;
    const actualMs = Date.now() - startTime;
    const delay = expectedMs - actualMs;
    if (delay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  };
}
