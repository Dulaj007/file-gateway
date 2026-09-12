import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings, serializeSettings } from "@/lib/settings";
import type { Prisma } from "@/generated/prisma/client";

const urlOrEmpty = z.union([z.literal(""), z.string().url()]);
const hexColor = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Must be a hex color.");
const positiveInt = z.number().int().positive();

const bodySchema = z.object({
  siteName: z.string().trim().min(1).optional(),
  siteTagline: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageUrl: urlOrEmpty.optional(),
  faviconUrl: urlOrEmpty.optional(),
  themeDefault: z.enum(["light", "dark", "system"]).optional(),
  accentColor: hexColor.optional(),

  storageCapBytes: positiveInt.optional(),
  imageMaxBytes: positiveInt.optional(),
  videoMaxBytes: positiveInt.optional(),
  zipMaxBytes: positiveInt.optional(),
  ipDailyMaxUploads: positiveInt.optional(),
  ipDailyMaxBytes: positiveInt.optional(),
  timerStartSeconds: positiveInt.optional(),
  timerArticleSeconds: positiveInt.optional(),
  timerFinalSeconds: positiveInt.optional(),
  defaultExpiry: z.enum(["1d", "7d", "30d", "never"]).optional(),
  articleHops: z.union([z.literal(1), z.literal(2)]).optional(),

  mainDomain: z.string().trim().optional(),
  article1Domain: z.string().trim().optional(),
  article2Domain: z.string().trim().optional(),
  middleDomain: z.string().trim().optional(),
  displayDomain: z.string().trim().nullable().optional(),
  adminSecretPath: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, hyphens, and underscores only.")
    .optional(),
});

export async function GET(request: Request, context: RouteContext<"/[secret]/api/settings">) {
  const { secret } = await context.params;
  const guard = await requireAdminApi(secret);
  if (!guard.ok) return guard.response;

  const settings = await getSettings();
  return NextResponse.json({ settings: serializeSettings(settings) });
}

export async function PUT(request: Request, context: RouteContext<"/[secret]/api/settings">) {
  const { secret } = await context.params;
  const guard = await requireAdminApi(secret, request, true);
  if (!guard.ok) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Reserved top-level path segments this project already routes on — an
  // admin secret path colliding with one of these would make either the
  // secret path or the colliding route unreachable.
  const RESERVED_PATHS = new Set([
    "api",
    "article",
    "d",
    "dl",
    "dmca",
    "privacy",
    "terms",
    "contact",
    "display-redirect",
    "route-not-available",
  ]);
  if (parsed.data.adminSecretPath && RESERVED_PATHS.has(parsed.data.adminSecretPath)) {
    return NextResponse.json(
      { error: `"${parsed.data.adminSecretPath}" is reserved and can't be used as the admin path.` },
      { status: 400 }
    );
  }

  const data: Prisma.SettingUpdateInput = { ...parsed.data };
  // BigInt fields arrive as plain numbers over JSON — convert them back.
  for (const key of [
    "storageCapBytes",
    "imageMaxBytes",
    "videoMaxBytes",
    "zipMaxBytes",
    "ipDailyMaxBytes",
  ] as const) {
    if (parsed.data[key] !== undefined) {
      (data as Record<string, unknown>)[key] = BigInt(parsed.data[key]);
    }
  }

  const updated = await db.setting.update({ where: { id: 1 }, data });

  return NextResponse.json({ settings: serializeSettings(updated) });
}
