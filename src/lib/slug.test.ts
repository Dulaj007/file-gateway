import { describe, expect, it } from "vitest";
import { randomSlug, randomStoredName, slugify } from "./slug";

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

describe("slugify", () => {
  it("lowercases and hyphenates a normal title", () => {
    expect(slugify("A Five-Minute Morning Routine")).toBe("a-five-minute-morning-routine");
  });

  it("collapses punctuation and whitespace into single hyphens", () => {
    expect(slugify("Wait... what?!  Really??")).toBe("wait-what-really");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -- leading and trailing -- ")).toBe("leading-and-trailing");
  });
});
