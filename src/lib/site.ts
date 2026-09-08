import { headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import type { Setting } from "@/generated/prisma/client";

export type SiteRole = "main" | "article1" | "article2" | "display" | "unknown";

export function siteRoleForHost(host: string, settings: Setting): SiteRole {
  // The `&&` guards matter: an unconfigured domain field defaults to "" (or
  // null for displayDomain), and a request with no Host header falls back to
  // "" too (see getCurrentSiteRole below) — without the guard, an empty
  // field would incorrectly match an empty host.
  if (host && host === settings.article1Domain) return "article1";
  if (host && host === settings.article2Domain) return "article2";
  if (host && settings.displayDomain && host === settings.displayDomain) return "display";
  if (host && host === settings.mainDomain) return "main";
  return "unknown";
}

// For use in Server Components/pages, where the current request's headers
// are read via next/headers rather than a NextRequest object directly
// (proxy.ts does its own host matching against the raw request).
export async function getCurrentSiteRole(): Promise<SiteRole> {
  const host = (await headers()).get("host") ?? "";
  const settings = await getSettings();
  return siteRoleForHost(host, settings);
}
