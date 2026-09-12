import { describe, expect, it } from "vitest";
import { matchOrigin } from "./cors";

function requestWithOrigin(origin: string | null): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("https://example.test/api/x", { headers });
}

describe("matchOrigin", () => {
  it("returns the origin when it matches the allowed domain", () => {
    expect(matchOrigin(requestWithOrigin("https://uptimer.example"), "uptimer.example")).toBe(
      "https://uptimer.example"
    );
  });

  it("returns null when the origin's host does not match", () => {
    expect(matchOrigin(requestWithOrigin("https://evil.example"), "uptimer.example")).toBeNull();
  });

  it("returns null when there is no Origin header", () => {
    expect(matchOrigin(requestWithOrigin(null), "uptimer.example")).toBeNull();
  });

  it("returns null when no domain is configured yet", () => {
    expect(matchOrigin(requestWithOrigin("https://uptimer.example"), "")).toBeNull();
  });

  it("returns null for a malformed Origin header rather than throwing", () => {
    expect(matchOrigin(requestWithOrigin("not-a-url"), "uptimer.example")).toBeNull();
  });

  it("ignores scheme differences and matches on host only", () => {
    expect(matchOrigin(requestWithOrigin("http://uptimer.example"), "uptimer.example")).toBe(
      "http://uptimer.example"
    );
  });

  it("matches against any domain in an array (e.g. gate/check shared by two article sites)", () => {
    const domains = ["cosmira.example", "veloura.example"];
    expect(matchOrigin(requestWithOrigin("https://veloura.example"), domains)).toBe(
      "https://veloura.example"
    );
    expect(matchOrigin(requestWithOrigin("https://cosmira.example"), domains)).toBe(
      "https://cosmira.example"
    );
    expect(matchOrigin(requestWithOrigin("https://evil.example"), domains)).toBeNull();
  });

  it("filters out empty strings from an array of not-yet-configured domains", () => {
    expect(matchOrigin(requestWithOrigin("https://cosmira.example"), ["", "cosmira.example"])).toBe(
      "https://cosmira.example"
    );
    expect(matchOrigin(requestWithOrigin("https://cosmira.example"), ["", ""])).toBeNull();
  });
});
