import { describe, expect, it } from "vitest";
import { createThrottle } from "./throttle";

describe("createThrottle", () => {
  it("does not delay when the rate limit is disabled (0)", async () => {
    const wait = createThrottle(0);
    const start = Date.now();
    await wait(10_000_000); // huge chunk — would take a long time if throttled
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("does not delay while comfortably under the target rate", async () => {
    const wait = createThrottle(1_000_000); // 1 MB/s
    const start = Date.now();
    await wait(1000); // 1 KB, ~1ms of "budget" at this rate
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("delays once the sent bytes exceed what the elapsed time allows", async () => {
    const wait = createThrottle(1000); // 1000 bytes/sec
    const start = Date.now();
    await wait(1000); // instantly "spends" a full second of budget
    const elapsed = Date.now() - start;
    // Expected schedule for 1000 bytes at 1000 B/s is 1000ms in, so the
    // second call should be held back close to that mark.
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });
});
