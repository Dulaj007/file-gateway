import { describe, expect, it } from "vitest";
import { computeExpiresAt } from "./expiry";

describe("computeExpiresAt", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("returns null for never", () => {
    expect(computeExpiresAt("never", now)).toBeNull();
  });

  it("adds 1 day", () => {
    expect(computeExpiresAt("1d", now)).toEqual(new Date("2026-01-02T00:00:00.000Z"));
  });

  it("adds 7 days", () => {
    expect(computeExpiresAt("7d", now)).toEqual(new Date("2026-01-08T00:00:00.000Z"));
  });

  it("adds 30 days", () => {
    expect(computeExpiresAt("30d", now)).toEqual(new Date("2026-01-31T00:00:00.000Z"));
  });

  it("throws on an unrecognized value", () => {
    expect(() => computeExpiresAt("banana", now)).toThrow(/Unknown expiry duration/);
  });
});
