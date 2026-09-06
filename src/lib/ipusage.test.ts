import { describe, expect, it } from "vitest";
import { evaluateIpQuota, getClientIp } from "./ipusage";

describe("evaluateIpQuota", () => {
  const limits = { ipDailyMaxUploads: 20, ipDailyMaxBytes: 1_000n };

  it("allows uploads within both limits", () => {
    const result = evaluateIpQuota({ uploadCount: 5, totalBytes: 100n }, 50n, limits);
    expect(result).toEqual({ ok: true });
  });

  it("rejects once the daily upload count is reached", () => {
    const result = evaluateIpQuota({ uploadCount: 20, totalBytes: 0n }, 1n, limits);
    expect(result.ok).toBe(false);
  });

  it("rejects when the incoming file would exceed the daily byte cap", () => {
    const result = evaluateIpQuota({ uploadCount: 0, totalBytes: 950n }, 51n, limits);
    expect(result.ok).toBe(false);
  });

  it("allows exactly hitting the byte cap (not exceeding it)", () => {
    const result = evaluateIpQuota({ uploadCount: 0, totalBytes: 950n }, 50n, limits);
    expect(result).toEqual({ ok: true });
  });
});

describe("getClientIp", () => {
  it("prefers the first entry of x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "203.0.113.9" } });
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to a local placeholder with no proxy headers", () => {
    const req = new Request("http://x");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
