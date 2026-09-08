import { db } from "@/lib/db";
import { runCleanup } from "@/lib/cleanup";

// Standalone entry point for system cron (see README's "Cleanup" section)
// as a fallback/alternative to the in-process node-cron scheduler wired up
// in src/instrumentation.ts. Same runCleanup() either way — this just gives
// ops a way to run it without the app process itself needing to be alive.
async function main() {
  const result = await runCleanup();
  console.log("Cleanup complete:", result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
