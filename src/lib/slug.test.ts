import { describe, expect, it } from "vitest";
import { randomSlug, randomStoredName } from "./slug";

describe("randomSlug", () => {
  it("is URL-safe (no +, /, or =)", () => {
    expect(randomSlug()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces distinct values across many calls", () => {
    const slugs = new Set(Array.from({ length: 1000 }, () => randomSlug()));
    expect(slugs.size).toBe(1000);
  });
});

describe("randomStoredName", () => {
  it("appends the given extension", () => {
    expect(randomStoredName("png")).toMatch(/^[A-Za-z0-9_-]+\.png$/);
  });

  it("strips a leading dot if one is passed", () => {
    expect(randomStoredName(".zip")).toMatch(/^[A-Za-z0-9_-]+\.zip$/);
  });
});
