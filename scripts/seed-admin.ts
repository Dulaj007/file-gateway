import argon2 from "argon2";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// First-boot bootstrap: ensures the single Setting row exists (same
// auto-create getSettings() would do lazily on the app's first request) and
// creates the single admin account from ADMIN_USERNAME/ADMIN_PASSWORD if no
// admin exists yet. Idempotent: safe to re-run, a no-op once both exist.
async function main() {
  const settings = await getSettings();
  console.log(`Settings row ready (adminSecretPath="${settings.adminSecretPath}").`);

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set (see .env.example)."
    );
  }

  const existing = await db.adminUser.findFirst();
  if (existing) {
    console.log(`Admin user already exists ("${existing.username}") — skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(password);
  const admin = await db.adminUser.create({ data: { username, passwordHash } });
  console.log(`Created admin user "${admin.username}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
