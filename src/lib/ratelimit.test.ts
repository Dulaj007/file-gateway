import { describe, expect, it } from "vitest";
import { checkRateLimit, createRateLimiter } from "./ratelimit";

describe("checkRateLimit", () => {
  it("allows attempts within the limit", async () => {
    const limiter = createRateLimiter({ points: 3, duration: 60 });
    expect(await checkRateLimit(limiter, "key-a")).toBe(true);
    expect(await checkRateLimit(limiter, "key-a")).toBe(true);
    expect(await checkRateLimit(limiter, "key-a")).toBe(true);
  });

  it("rejects once the limit is exceeded", async () => {
    const limiter = createRateLimiter({ points: 2, duration: 60 });
    expect(await checkRateLimit(limiter, "key-b")).toBe(true);
    expect(await checkRateLimit(limiter, "key-b")).toBe(true);
    expect(await checkRateLimit(limiter, "key-b")).toBe(false);
  });

  it("tracks separate keys independently", async () => {
    const limiter = createRateLimiter({ points: 1, duration: 60 });
    expect(await checkRateLimit(limiter, "ip-1")).toBe(true);
    expect(await checkRateLimit(limiter, "ip-2")).toBe(true);
    expect(await checkRateLimit(limiter, "ip-1")).toBe(false);
  });
});
