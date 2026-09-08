import { describe, expect, it } from "vitest";
import { siteRoleForHost } from "./site";
import type { Setting } from "@/generated/prisma/client";

const settings = {
  mainDomain: "main.example.com",
  article1Domain: "xyz.example.com",
  article2Domain: "rtx.example.com",
  displayDomain: "links.example.com",
} as Setting;

describe("siteRoleForHost", () => {
  it("identifies each configured domain", () => {
    expect(siteRoleForHost("main.example.com", settings)).toBe("main");
    expect(siteRoleForHost("xyz.example.com", settings)).toBe("article1");
    expect(siteRoleForHost("rtx.example.com", settings)).toBe("article2");
    expect(siteRoleForHost("links.example.com", settings)).toBe("display");
  });

  it("returns unknown for an unrecognized host", () => {
    expect(siteRoleForHost("evil.example.com", settings)).toBe("unknown");
  });

  it("does not match unconfigured (empty-string) domain fields against an empty host", () => {
    const unconfigured = {
      mainDomain: "",
      article1Domain: "",
      article2Domain: "",
      displayDomain: "",
    } as Setting;
    expect(siteRoleForHost("", unconfigured)).toBe("unknown");
  });
});
