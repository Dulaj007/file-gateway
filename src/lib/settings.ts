import { db } from "@/lib/db";
import type { Setting } from "@/generated/prisma/client";

let cached: Setting | null = null;

// Read-through cache around the single Setting row. The row is created from
// env on first call if it doesn't exist yet (fresh DB). Call
// invalidateSettingsCache() after any admin write so the next read reflects it.
export async function getSettings(): Promise<Setting> {
  if (cached) return cached;

  cached = await db.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      mainDomain: process.env.MAIN_DOMAIN ?? "",
      article1Domain: process.env.ARTICLE1_DOMAIN ?? "",
      article2Domain: process.env.ARTICLE2_DOMAIN ?? "",
      displayDomain: process.env.DISPLAY_DOMAIN || null,
      adminSecretPath: process.env.ADMIN_SECRET_PATH ?? "admin",
    },
    update: {},
  });

  return cached;
}

export function invalidateSettingsCache() {
  cached = null;
}
