import { describe, expect, it } from "vitest";
import { articleSiteForStep } from "./articles";

describe("articleSiteForStep", () => {
  it("maps step 2 to article1", () => {
    expect(articleSiteForStep(2)).toBe("article1");
  });

  it("maps step 3 to article2", () => {
    expect(articleSiteForStep(3)).toBe("article2");
  });
});
