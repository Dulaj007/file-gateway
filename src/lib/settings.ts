import { db } from "@/lib/db";
import type { Setting } from "@/generated/prisma/client";

// Deliberately uncached: reads the single Setting row fresh every call.
// better-sqlite3 is synchronous and this is a single-row primary-key lookup,
// so the cost is negligible — and an in-memory cache here previously caused
// real bugs, since Next/Turbopack bundles each route into its own module
// graph in production, so a module-level cache variable is NOT a reliable
// process-wide singleton: an admin edit invalidated in one route's copy of
// this module could stay stale in another route's (e.g. proxy.ts's) copy.
// The row is created from env on first call if it doesn't exist yet (fresh DB).
export async function getSettings(): Promise<Setting> {
  const existing = await db.setting.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  return db.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      mainDomain: process.env.MAIN_DOMAIN ?? "",
      article1Domain: process.env.ARTICLE1_DOMAIN ?? "",
      article2Domain: process.env.ARTICLE2_DOMAIN ?? "",
      middleDomain: process.env.MIDDLE_DOMAIN ?? "",
      displayDomain: process.env.DISPLAY_DOMAIN || null,
      adminSecretPath: process.env.ADMIN_SECRET_PATH ?? "admin",
    },
    update: {},
  });
}

// Setting's byte-count fields are Prisma BigInt, which JSON.stringify can't
// serialize on its own — see the identical note on serializeFile in
// lib/files.ts. Number() is safe: these are admin-entered limits, not
// arbitrary data, and stay far below Number.MAX_SAFE_INTEGER in practice.
export function serializeSettings(settings: Setting) {
  return {
    siteName: settings.siteName,
    siteTagline: settings.siteTagline,
    metaTitle: settings.metaTitle,
    metaDescription: settings.metaDescription,
    ogImageUrl: settings.ogImageUrl,
    faviconUrl: settings.faviconUrl,
    themeDefault: settings.themeDefault,
    accentColor: settings.accentColor,
    storageCapBytes: Number(settings.storageCapBytes),
    imageMaxBytes: Number(settings.imageMaxBytes),
    videoMaxBytes: Number(settings.videoMaxBytes),
    zipMaxBytes: Number(settings.zipMaxBytes),
    ipDailyMaxUploads: settings.ipDailyMaxUploads,
    ipDailyMaxBytes: Number(settings.ipDailyMaxBytes),
    timerStartSeconds: settings.timerStartSeconds,
    timerArticleSeconds: settings.timerArticleSeconds,
    timerFinalSeconds: settings.timerFinalSeconds,
    defaultExpiry: settings.defaultExpiry,
    articleHops: settings.articleHops,
    mainDomain: settings.mainDomain,
    article1Domain: settings.article1Domain,
    article2Domain: settings.article2Domain,
    middleDomain: settings.middleDomain,
    displayDomain: settings.displayDomain,
    adminSecretPath: settings.adminSecretPath,
  };
}

export type SerializedSettings = ReturnType<typeof serializeSettings>;
